using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Queries.GetItemHistory;

public class GetItemHistoryQueryHandler : IRequestHandler<GetItemHistoryQuery, Result<IEnumerable<ItemMovementHistoryDto>>>
{
    private readonly StockDbContext _context;

    public GetItemHistoryQueryHandler(StockDbContext context) => _context = context;

    public async Task<Result<IEnumerable<ItemMovementHistoryDto>>> Handle(GetItemHistoryQuery request, CancellationToken cancellationToken)
    {
        // Get all movement lines for this stock item
        var lines = await _context.StockMovementLines
            .AsNoTracking()
            .Where(l => l.StockItemId == request.StockItemId)
            .ToListAsync(cancellationToken);

        var movementIds = lines.Select(l => l.StockMovementId).Distinct().ToList();

        var movements = await _context.StockMovements
            .AsNoTracking()
            .Where(m => movementIds.Contains(m.Id))
            .OrderByDescending(m => m.MovementDate)
            .ToListAsync(cancellationToken);

        // Fetch related names
        var warehouseIds = movements
            .SelectMany(m => new[] { m.SourceWarehouseId, m.DestinationWarehouseId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var supplierIds = movements.Where(m => m.SupplierId.HasValue).Select(m => m.SupplierId!.Value).Distinct().ToList();
        var departmentIds = movements.Where(m => m.DepartmentId.HasValue).Select(m => m.DepartmentId!.Value).Distinct().ToList();
        var lotIds = lines.Where(l => l.StockLotId.HasValue).Select(l => l.StockLotId!.Value).Distinct().ToList();

        var warehouses = await _context.Warehouses.Where(w => warehouseIds.Contains(w.Id)).ToListAsync(cancellationToken);
        var suppliers = await _context.Suppliers.Where(s => supplierIds.Contains(s.Id)).ToListAsync(cancellationToken);
        var departments = await _context.Departments.Where(d => departmentIds.Contains(d.Id)).ToListAsync(cancellationToken);
        var lots = await _context.StockLots.Where(l => lotIds.Contains(l.Id)).ToListAsync(cancellationToken);

        // Apply pagination
        int pageNumber = request.PageNumber ?? 1;
        int pageSize = request.PageSize ?? 50;
        var pagedMovements = movements.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        var typeFrMap = new Dictionary<string, string>
        {
            ["Reception"] = "Réception",
            ["Issue"] = "Sortie",
            ["Transfer"] = "Transfert",
            ["Return"] = "Retour",
            ["Adjustment"] = "Ajustement",
            ["Disposal"] = "Mise au rebut"
        };

        var dtos = pagedMovements.Select(m =>
        {
            var line = lines.First(l => l.StockMovementId == m.Id);
            var lot = line.StockLotId.HasValue ? lots.FirstOrDefault(l => l.Id == line.StockLotId.Value) : null;
            var typeStr = m.Type.ToString();
            return new ItemMovementHistoryDto
            {
                MovementId = m.Id,
                MovementNumber = m.MovementNumber,
                Type = typeStr,
                TypeFr = typeFrMap.TryGetValue(typeStr, out var fr) ? fr : typeStr,
                Status = m.Status.ToString(),
                MovementDate = m.MovementDate,
                Quantity = line.Quantity.Value,
                Unit = line.Quantity.Unit.ToString(),
                LotNumber = lot?.LotNumber?.Value,
                SourceWarehouseName = m.SourceWarehouseId.HasValue
                    ? warehouses.FirstOrDefault(w => w.Id == m.SourceWarehouseId.Value)?.Name : null,
                DestinationWarehouseName = m.DestinationWarehouseId.HasValue
                    ? warehouses.FirstOrDefault(w => w.Id == m.DestinationWarehouseId.Value)?.Name : null,
                DepartmentName = m.DepartmentId.HasValue
                    ? departments.FirstOrDefault(d => d.Id == m.DepartmentId.Value)?.Name : null,
                SupplierName = m.SupplierId.HasValue
                    ? suppliers.FirstOrDefault(s => s.Id == m.SupplierId.Value)?.Name : null,
                CreatedByUser = m.CreatedByUser,
                Reference = m.Reference,
                Notes = m.Notes
            };
        });

        return Result<IEnumerable<ItemMovementHistoryDto>>.Success(dtos);
    }
}
