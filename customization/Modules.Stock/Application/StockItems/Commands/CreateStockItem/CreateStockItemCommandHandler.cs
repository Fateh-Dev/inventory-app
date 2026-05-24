using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Commands.CreateStockItem;

public class CreateStockItemCommandHandler : IRequestHandler<CreateStockItemCommand, Result<StockItemDto>>
{
    private readonly StockDbContext _context;

    public CreateStockItemCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<StockItemDto>> Handle(CreateStockItemCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.StockItems.AnyAsync(i => i.Reference == request.Reference, cancellationToken);
        if (existing)
            return Result<StockItemDto>.Failure(Error.Conflict("StockItem.ReferenceConflict", $"Stock item reference {request.Reference} already exists."));

        if (request.DefaultSupplierId.HasValue)
        {
            var supplierExists = await _context.Suppliers.AnyAsync(s => s.Id == request.DefaultSupplierId.Value, cancellationToken);
            if (!supplierExists)
                return Result<StockItemDto>.Failure(Error.NotFound("Supplier.NotFound", $"Default supplier with ID {request.DefaultSupplierId.Value} was not found."));
        }

        var category = await _context.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (category == null)
            return Result<StockItemDto>.Failure(Error.NotFound("Category.NotFound", "Category not found"));

        var item = StockItem.Create(
            request.Reference,
            request.Name,
            request.Description,
            request.CategoryId,
            request.DefaultUnit,
            request.HasExpiryDate,
            request.RequiresSerialNumber,
            request.DefaultLowStockThreshold,
            request.DefaultSupplierId,
            request.BrandId,
            request.BrandModelId
        );

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

        _context.StockItems.Add(item);
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
            CreatedAt = System.DateTime.UtcNow
        };

        return Result<StockItemDto>.Success(dto);
    }
}
