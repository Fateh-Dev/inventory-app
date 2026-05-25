using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Queries.GetAllStockItems;

public class GetAllStockItemsQueryHandler : IRequestHandler<GetAllStockItemsQuery, Result<IEnumerable<StockItemDto>>>
{
    private readonly StockDbContext _context;

    public GetAllStockItemsQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IEnumerable<StockItemDto>>> Handle(GetAllStockItemsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.StockItems
            .Include(i => i.Lots)
            .AsNoTracking()
            .AsQueryable();

        if (request.CategoryId.HasValue)
        {
            query = query.Where(i => i.CategoryId == request.CategoryId.Value);
        }

        if (request.ActiveOnly.HasValue && request.ActiveOnly.Value)
        {
            query = query.Where(i => i.IsActive);
        }

        if (request.HasExpiryOnly.HasValue && request.HasExpiryOnly.Value)
        {
            query = query.Where(i => i.HasExpiryDate);
        }

        if (request.LowStockOnly.HasValue && request.LowStockOnly.Value)
        {
            var today = System.DateTime.UtcNow.Date;
            query = query.Where(i => i.Lots.Where(l => !(l.ExpiryDate != null && l.ExpiryDate.Value.Date <= today)).Sum(l => l.CurrentQuantity.Value) <= i.DefaultLowStockThreshold);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(i => i.Name.ToLower().Contains(term) || i.Reference.ToLower().Contains(term));
        }

        query = query.OrderBy(i => i.Reference);

        if (request.PageNumber.HasValue && request.PageSize.HasValue)
        {
            int pageNumber = request.PageNumber.Value;
            int pageSize = request.PageSize.Value;
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            query = query.Skip((pageNumber - 1) * pageSize).Take(pageSize);
        }
        else
        {
            query = query.Take(100); // Safe fallback limit
        }

        var items = await query.ToListAsync(cancellationToken);

        // We also need SupplierName. Ideally join, but let's fetch dictionary or join.
        var supplierIds = items.Where(i => i.DefaultSupplierId.HasValue).Select(i => i.DefaultSupplierId.Value).Distinct().ToList();
        var suppliers = await _context.Suppliers.AsNoTracking()
            .Where(s => supplierIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Name, cancellationToken);

        var brandIds = items.Where(i => i.BrandId.HasValue).Select(i => i.BrandId!.Value).Distinct().ToList();
        var brands = await _context.Brands.AsNoTracking()
            .Where(b => brandIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.Name, cancellationToken);

        var modelIds = items.Where(i => i.BrandModelId.HasValue).Select(i => i.BrandModelId!.Value).Distinct().ToList();
        var models = await _context.BrandModels.AsNoTracking()
            .Where(m => modelIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, m => m.Name, cancellationToken);

        var catIds = items.Select(i => i.CategoryId).Distinct().ToList();
        var categories = await _context.Categories.AsNoTracking()
            .Where(c => catIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);

        var dtos = items.Select(item => new StockItemDto
        {
            Id = item.Id,
            Reference = item.Reference,
            Name = item.Name,
            Description = item.Description,
            CategoryName = categories.ContainsKey(item.CategoryId) ? categories[item.CategoryId] : "N/A",
            CategoryId = item.CategoryId,
            DefaultUnit = item.DefaultUnit.ToString(),
            DefaultUnitId = (int)item.DefaultUnit,
            BrandId = item.BrandId,
            BrandName = item.BrandId.HasValue && brands.ContainsKey(item.BrandId.Value) ? brands[item.BrandId.Value] : null,
            BrandModelId = item.BrandModelId,
            BrandModelName = item.BrandModelId.HasValue && models.ContainsKey(item.BrandModelId.Value) ? models[item.BrandModelId.Value] : null,
            RequiresSerialNumber = item.RequiresSerialNumber,
            HasExpiryDate = item.HasExpiryDate,
            DefaultLowStockThreshold = item.DefaultLowStockThreshold,
            IsActive = item.IsActive,
            DefaultSupplierId = item.DefaultSupplierId,
            DefaultSupplierName = item.DefaultSupplierId.HasValue && suppliers.ContainsKey(item.DefaultSupplierId.Value) 
                ? suppliers[item.DefaultSupplierId.Value] : null,
            TotalQuantity = item.TotalQuantity,
            IsLowStock = item.IsLowStock,
            ExpiringLotCount = item.ExpiringLotCount
        });

        return Result<IEnumerable<StockItemDto>>.Success(dtos);
    }
}
