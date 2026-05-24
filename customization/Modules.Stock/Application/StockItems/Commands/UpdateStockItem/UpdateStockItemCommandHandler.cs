using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Commands.UpdateStockItem;

public class UpdateStockItemCommandHandler : IRequestHandler<UpdateStockItemCommand, Result<StockItemDto>>
{
    private readonly StockDbContext _context;

    public UpdateStockItemCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<StockItemDto>> Handle(UpdateStockItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _context.StockItems.FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);
        if (item == null)
            return Result<StockItemDto>.Failure(Error.NotFound("StockItem.NotFound", $"Stock item with ID {request.Id} was not found."));

        if (request.DefaultSupplierId.HasValue)
        {
            var supplierExists = await _context.Suppliers.AnyAsync(s => s.Id == request.DefaultSupplierId.Value, cancellationToken);
            if (!supplierExists)
                return Result<StockItemDto>.Failure(Error.NotFound("Supplier.NotFound", $"Default supplier with ID {request.DefaultSupplierId.Value} was not found."));
        }

        var category = await _context.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (category == null)
            return Result<StockItemDto>.Failure(Error.NotFound("Category.NotFound", "Category not found"));

        string? brandName = null;
        if (request.BrandId.HasValue)
        {
            var brand = await _context.Brands.AsNoTracking().FirstOrDefaultAsync(b => b.Id == request.BrandId.Value, cancellationToken);
            brandName = brand?.Name;
        }

        string? modelName = null;
        if (request.BrandModelId.HasValue)
        {
            var model = await _context.BrandModels.AsNoTracking().FirstOrDefaultAsync(m => m.Id == request.BrandModelId.Value, cancellationToken);
            modelName = model?.Name;
        }

        string? supplierName = null;
        if (request.DefaultSupplierId.HasValue)
        {
            var supplier = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == request.DefaultSupplierId.Value, cancellationToken);
            supplierName = supplier?.Name;
        }

        item.Update(
            request.Name,
            request.Description,
            request.CategoryId,
            request.DefaultUnit,
            request.BrandId,
            request.BrandModelId,
            request.RequiresSerialNumber,
            request.HasExpiryDate,
            request.DefaultLowStockThreshold,
            request.DefaultSupplierId
        );

        await _context.SaveChangesAsync(cancellationToken);

        var dto = new StockItemDto
        {
            Id = item.Id,
            Reference = item.Reference,
            Name = item.Name,
            Description = item.Description,
            CategoryName = category.Name,
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
            UpdatedAt = System.DateTime.UtcNow
        };

        return Result<StockItemDto>.Success(dto);
    }
}
