using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Queries.GetWarehouseStock;

public class GetWarehouseStockQueryHandler : IRequestHandler<GetWarehouseStockQuery, Result<IEnumerable<StockLotDto>>>
{
    private readonly StockDbContext _context;

    public GetWarehouseStockQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IEnumerable<StockLotDto>>> Handle(GetWarehouseStockQuery request, CancellationToken cancellationToken)
    {
        var warehouseExists = await _context.Warehouses.AnyAsync(w => w.Id == request.WarehouseId, cancellationToken);
        if (!warehouseExists)
            return Result<IEnumerable<StockLotDto>>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID {request.WarehouseId} was not found."));

        var lots = await _context.StockLots.AsNoTracking()
            .Where(l => l.WarehouseId == request.WarehouseId)
            .Join(_context.StockItems, l => l.StockItemId, i => i.Id, (l, i) => new { Lot = l, Item = i })
            .ToListAsync(cancellationToken);

        var dtos = lots.Select(x => new StockLotDto
        {
            Id = x.Lot.Id,
            StockItemId = x.Item.Id,
            StockItemName = x.Item.Name,
            StockItemReference = x.Item.Reference,
            WarehouseId = x.Lot.WarehouseId,
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
