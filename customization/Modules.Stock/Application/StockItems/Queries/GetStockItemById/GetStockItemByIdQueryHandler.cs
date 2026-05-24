using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Queries.GetStockItemById;

public class GetStockItemByIdQueryHandler : IRequestHandler<GetStockItemByIdQuery, Result<StockItemDto>>
{
    private readonly StockDbContext _context;

    public GetStockItemByIdQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<StockItemDto>> Handle(GetStockItemByIdQuery request, CancellationToken cancellationToken)
    {
        var item = await _context.StockItems
            .Include(i => i.Lots)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);

        if (item == null)
            return Result<StockItemDto>.Failure(Error.NotFound("StockItem.NotFound", $"Stock item with ID {request.Id} was not found."));

        string? supplierName = null;
        if (item.DefaultSupplierId.HasValue)
        {
            var supplier = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == item.DefaultSupplierId.Value, cancellationToken);
            supplierName = supplier?.Name;
        }

        string? brandName = null;
        if (item.BrandId.HasValue)
        {
            var brand = await _context.Brands.AsNoTracking().FirstOrDefaultAsync(b => b.Id == item.BrandId.Value, cancellationToken);
            brandName = brand?.Name;
        }

        string? modelName = null;
        if (item.BrandModelId.HasValue)
        {
            var model = await _context.BrandModels.AsNoTracking().FirstOrDefaultAsync(m => m.Id == item.BrandModelId.Value, cancellationToken);
            modelName = model?.Name;
        }

        var category = await _context.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == item.CategoryId, cancellationToken);
        var categoryName = category?.Name ?? "N/A";

        var dto = new StockItemDto
        {
            Id = item.Id,
            Reference = item.Reference,
            Name = item.Name,
            Description = item.Description,
            CategoryName = categoryName,
            CategoryId = item.CategoryId,
            DefaultUnit = item.DefaultUnit.ToString(),
            DefaultUnitId = (int)item.DefaultUnit,
            BrandId = item.BrandId,
            BrandName = brandName,
            BrandModelId = item.BrandModelId,
            BrandModelName = modelName,
            RequiresSerialNumber = item.RequiresSerialNumber,
            HasExpiryDate = item.HasExpiryDate,
            DefaultLowStockThreshold = item.DefaultLowStockThreshold,
            IsActive = item.IsActive,
            DefaultSupplierId = item.DefaultSupplierId,
            DefaultSupplierName = supplierName,
            TotalQuantity = item.TotalQuantity,
            IsLowStock = item.IsLowStock,
            ExpiringLotCount = item.ExpiringLotCount
        };

        return Result<StockItemDto>.Success(dto);
    }
}
