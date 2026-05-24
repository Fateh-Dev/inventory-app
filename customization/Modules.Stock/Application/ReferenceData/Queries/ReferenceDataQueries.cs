using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.ReferenceData.Queries;

public record GetAllBrandsQuery(bool? ActiveOnly = true) : IRequest<Result<IEnumerable<BrandDto>>>;
public record GetModelsByBrandQuery(Guid? BrandId) : IRequest<Result<IEnumerable<BrandModelDto>>>;
public record GetAllCategoriesQuery(bool? ActiveOnly = true) : IRequest<Result<IEnumerable<CategoryDto>>>;
public record GetAllDepartmentsQuery(bool? ActiveOnly = true) : IRequest<Result<IEnumerable<DepartmentDto>>>;

public class ReferenceDataQueryHandlers : 
    IRequestHandler<GetAllBrandsQuery, Result<IEnumerable<BrandDto>>>,
    IRequestHandler<GetModelsByBrandQuery, Result<IEnumerable<BrandModelDto>>>,
    IRequestHandler<GetAllCategoriesQuery, Result<IEnumerable<CategoryDto>>>,
    IRequestHandler<GetAllDepartmentsQuery, Result<IEnumerable<DepartmentDto>>>
{
    private readonly StockDbContext _context;
    public ReferenceDataQueryHandlers(StockDbContext context) => _context = context;

    public async Task<Result<IEnumerable<BrandDto>>> Handle(GetAllBrandsQuery request, CancellationToken ct)
    {
        var query = _context.Brands.AsNoTracking();
        if (request.ActiveOnly == true) query = query.Where(b => b.IsActive);
        return Result<IEnumerable<BrandDto>>.Success(await query.OrderBy(b => b.Name)
            .Select(b => new BrandDto(b.Id, b.Name, b.IsActive)).ToListAsync(ct));
    }

    public async Task<Result<IEnumerable<BrandModelDto>>> Handle(GetModelsByBrandQuery request, CancellationToken ct)
    {
        var query = _context.BrandModels.AsNoTracking();
        if (request.BrandId.HasValue) query = query.Where(m => m.BrandId == request.BrandId.Value);
        return Result<IEnumerable<BrandModelDto>>.Success(await query.OrderBy(m => m.Name)
            .Select(m => new BrandModelDto(m.Id, m.BrandId, m.Name, m.IsActive)).ToListAsync(ct));
    }

    public async Task<Result<IEnumerable<CategoryDto>>> Handle(GetAllCategoriesQuery request, CancellationToken ct)
    {
        var query = _context.Categories.AsNoTracking();
        if (request.ActiveOnly == true) query = query.Where(c => c.IsActive);
        return Result<IEnumerable<CategoryDto>>.Success(await query.OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Code, c.IsActive)).ToListAsync(ct));
    }

    public async Task<Result<IEnumerable<DepartmentDto>>> Handle(GetAllDepartmentsQuery request, CancellationToken ct)
    {
        var query = _context.Departments.AsNoTracking();
        if (request.ActiveOnly == true) query = query.Where(d => d.IsActive);
        return Result<IEnumerable<DepartmentDto>>.Success(await query.OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.Id, d.Name, d.Code, d.IsActive)).ToListAsync(ct));
    }
}
