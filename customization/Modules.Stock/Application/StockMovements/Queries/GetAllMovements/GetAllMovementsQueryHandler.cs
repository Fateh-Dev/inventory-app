using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Queries.GetAllMovements;

public class GetAllMovementsQueryHandler : IRequestHandler<GetAllMovementsQuery, Result<IEnumerable<StockMovementDto>>>
{
    private readonly StockDbContext _context;

    public GetAllMovementsQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IEnumerable<StockMovementDto>>> Handle(GetAllMovementsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.StockMovements.AsNoTracking();

        if (request.IncludeLines)
        {
            query = query.Include(m => m.Lines);
        }

        if (request.Type.HasValue)
            query = query.Where(m => m.Type == request.Type.Value);

        if (request.Status.HasValue)
            query = query.Where(m => m.Status == request.Status.Value);

        if (request.WarehouseId.HasValue)
            query = query.Where(m => m.SourceWarehouseId == request.WarehouseId.Value || m.DestinationWarehouseId == request.WarehouseId.Value);

        if (request.SupplierId.HasValue)
            query = query.Where(m => m.SupplierId == request.SupplierId.Value);

        if (request.FromDate.HasValue)
            query = query.Where(m => m.MovementDate >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(m => m.MovementDate <= request.ToDate.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(m => m.MovementNumber.ToLower().Contains(term) || (m.Reference != null && m.Reference.ToLower().Contains(term)));
        }

        query = query.OrderByDescending(m => m.MovementDate);

        if (request.PageNumber.HasValue || request.PageSize.HasValue)
        {
            int pageNumber = request.PageNumber ?? 1;
            int pageSize = request.PageSize ?? 25;
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            query = query.Skip((pageNumber - 1) * pageSize).Take(pageSize);
        }
        else
        {
            query = query.Take(100); // Safe fallback limit
        }

        var movements = await query.ToListAsync(cancellationToken);

        var stockItems = new List<Modules.Stock.Domain.Entities.StockItem>();
        var stockLots = new List<Modules.Stock.Domain.Entities.StockLot>();

        if (request.IncludeLines && movements.Any())
        {
            var itemIds = movements.SelectMany(m => m.Lines).Select(l => l.StockItemId).Distinct().ToList();
            var lotIds = movements.SelectMany(m => m.Lines).Where(l => l.StockLotId.HasValue).Select(l => l.StockLotId.Value).Distinct().ToList();

            stockItems = await _context.StockItems.Where(i => itemIds.Contains(i.Id)).ToListAsync(cancellationToken);
            stockLots = await _context.StockLots.Where(l => lotIds.Contains(l.Id)).ToListAsync(cancellationToken);

            foreach (var item in stockItems)
            {
                Console.WriteLine($"[DEBUG] FOUND STOCK ITEM: {item.Id} - {item.Name} - {item.Reference}");
            }
        }

        // Map directly without full joining to Warehouses/Suppliers names to keep it simple, or we could fetch names.
        // For simplicity we will leave Names null if not specifically requested with a heavy join.
        var dtos = movements.Select(m => new StockMovementDto
        {
            Id = m.Id,
            MovementNumber = m.MovementNumber,
            Type = m.Type.ToString(),
            TypeId = (int)m.Type,
            Status = m.Status.ToString(),
            StatusId = (int)m.Status,
            SourceWarehouseId = m.SourceWarehouseId,
            DestinationWarehouseId = m.DestinationWarehouseId,
            SupplierId = m.SupplierId,
            DepartmentId = m.DepartmentId,
            Reference = m.Reference,
            MovementDate = m.MovementDate,
            Notes = m.Notes,
            CreatedByUser = m.CreatedByUser,
            Lines = request.IncludeLines ? m.Lines.Select(l => new StockMovementLineDto
            {
                Id = l.Id,
                StockItemId = l.StockItemId,
                StockItemName = stockItems.FirstOrDefault(i => i.Id == l.StockItemId)?.Name,
                StockItemReference = stockItems.FirstOrDefault(i => i.Id == l.StockItemId)?.Reference,
                StockLotId = l.StockLotId,
                LotNumber = stockLots.FirstOrDefault(lot => lot.Id == l.StockLotId)?.LotNumber,
                Quantity = l.Quantity.Value,
                Unit = l.Quantity.Unit.ToString(),
                UnitCost = l.UnitCost.Amount,
                Currency = l.UnitCost.Currency,
                LineTotal = l.Quantity.Value * l.UnitCost.Amount,
                Notes = l.Notes ?? string.Empty,
                ExpiryDate = l.ExpiryDate,
                SerialNumber = l.SerialNumber
            }).ToList() : new List<StockMovementLineDto>(),
            TotalValue = request.IncludeLines ? m.Lines.Sum(l => l.Quantity.Value * l.UnitCost.Amount) : 0
        });

        return Result<IEnumerable<StockMovementDto>>.Success(dtos);
    }
}
