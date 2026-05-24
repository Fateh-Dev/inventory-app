using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Queries.GetLotsByStockItem;

public class GetLotsByStockItemQueryHandler : IRequestHandler<GetLotsByStockItemQuery, Result<IEnumerable<StockLotDto>>>
{
    private readonly StockDbContext _context;

    public GetLotsByStockItemQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IEnumerable<StockLotDto>>> Handle(GetLotsByStockItemQuery request, CancellationToken cancellationToken)
    {
        var itemExists = await _context.StockItems.AnyAsync(i => i.Id == request.StockItemId, cancellationToken);
        if (!itemExists)
            return Result<IEnumerable<StockLotDto>>.Failure(Error.NotFound("StockItem.NotFound", $"Stock item with ID {request.StockItemId} was not found."));

        var query = _context.StockLots.AsNoTracking()
            .Where(l => l.StockItemId == request.StockItemId)
            .Join(_context.StockItems, l => l.StockItemId, i => i.Id, (l, i) => new { Lot = l, Item = i })
            .Join(_context.Warehouses, x => x.Lot.WarehouseId, w => w.Id, (x, w) => new { x.Lot, x.Item, Warehouse = w });

        var lots = await query.ToListAsync(cancellationToken);

        if (request.ExcludeExpired.HasValue && request.ExcludeExpired.Value)
        {
            lots = lots.Where(x => !x.Lot.IsExpired).ToList();
        }

        var dtos = lots.Select(x => new StockLotDto
        {
            Id = x.Lot.Id,
            StockItemId = x.Item.Id,
            StockItemName = x.Item.Name,
            StockItemReference = x.Item.Reference,
            WarehouseId = x.Lot.WarehouseId,
            WarehouseName = x.Warehouse.Name,
            LotNumber = x.Lot.LotNumber.Value,
            SerialNumber = x.Lot.SerialNumber,
            CurrentQuantity = x.Lot.CurrentQuantity.Value,
            CurrentUnit = x.Lot.CurrentQuantity.Unit.ToString(),
            InitialQuantity = x.Lot.InitialQuantity.Value,
            InitialUnit = x.Lot.InitialQuantity.Unit.ToString(),
            ExpiryDate = x.Lot.ExpiryDate,
            ReceivedAt = x.Lot.ReceivedAt,
            UnitCost = x.Lot.UnitCost.Amount,
            Currency = x.Lot.UnitCost.Currency,
            IsExpired = x.Lot.IsExpired,
            IsLowStock = x.Lot.IsLowStock,
            LowStockThreshold = x.Lot.LowStockThreshold
        });

        return Result<IEnumerable<StockLotDto>>.Success(dtos);
    }
}
