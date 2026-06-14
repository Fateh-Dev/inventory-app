using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.ReferenceData.Commands;

public class ReferenceDataCommandHandlers :
    IRequestHandler<CreateBrandCommand, Result<BrandDto>>,
    IRequestHandler<UpdateBrandCommand, Result<BrandDto>>,
    IRequestHandler<CreateModelCommand, Result<BrandModelDto>>,
    IRequestHandler<UpdateModelCommand, Result<BrandModelDto>>,
    IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>,
    IRequestHandler<UpdateCategoryCommand, Result<CategoryDto>>,
    IRequestHandler<DeleteCategoryCommand, Result<bool>>,
    IRequestHandler<CreateDepartmentCommand, Result<DepartmentDto>>,
    IRequestHandler<UpdateDepartmentCommand, Result<DepartmentDto>>,
    IRequestHandler<DeleteDepartmentCommand, Result<bool>>,
    IRequestHandler<DeleteBrandCommand, Result<bool>>,
    IRequestHandler<DeleteModelCommand, Result<bool>>
{
    private readonly StockDbContext _context;
    public ReferenceDataCommandHandlers(StockDbContext context) => _context = context;

    public async Task<Result<BrandDto>> Handle(CreateBrandCommand request, CancellationToken ct)
    {
        var brand = Brand.Create(request.Name);
        _context.Brands.Add(brand);
        await _context.SaveChangesAsync(ct);
        return Result<BrandDto>.Success(new BrandDto(brand.Id, brand.Name, brand.IsActive));
    }

    public async Task<Result<BrandDto>> Handle(UpdateBrandCommand request, CancellationToken ct)
    {
        var brand = await _context.Brands.FindAsync(new object[] { request.Id }, ct);
        if (brand == null) return Result<BrandDto>.Failure(Error.NotFound("Brand.NotFound", "Brand not found"));
        brand.Update(request.Name);
        await _context.SaveChangesAsync(ct);
        return Result<BrandDto>.Success(new BrandDto(brand.Id, brand.Name, brand.IsActive));
    }

    public async Task<Result<BrandModelDto>> Handle(CreateModelCommand request, CancellationToken ct)
    {
        var model = BrandModel.Create(request.BrandId, request.Name);
        _context.BrandModels.Add(model);
        await _context.SaveChangesAsync(ct);
        return Result<BrandModelDto>.Success(new BrandModelDto(model.Id, model.BrandId, model.Name, model.IsActive));
    }

    public async Task<Result<BrandModelDto>> Handle(UpdateModelCommand request, CancellationToken ct)
    {
        var model = await _context.BrandModels.FindAsync(new object[] { request.Id }, ct);
        if (model == null) return Result<BrandModelDto>.Failure(Error.NotFound("Model.NotFound", "Model not found"));
        model.Update(request.Name);
        await _context.SaveChangesAsync(ct);
        return Result<BrandModelDto>.Success(new BrandModelDto(model.Id, model.BrandId, model.Name, model.IsActive));
    }

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken ct)
    {
        var category = Category.Create(request.Name, request.Code);
        _context.Categories.Add(category);
        await _context.SaveChangesAsync(ct);
        return Result<CategoryDto>.Success(new CategoryDto(category.Id, category.Name, category.Code, category.IsActive));
    }

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken ct)
    {
        var category = await _context.Categories.FindAsync(new object[] { request.Id }, ct);
        if (category == null) return Result<CategoryDto>.Failure(Error.NotFound("Category.NotFound", "Category not found"));
        category.Update(request.Name, request.Code);
        await _context.SaveChangesAsync(ct);
        return Result<CategoryDto>.Success(new CategoryDto(category.Id, category.Name, category.Code, category.IsActive));
    }

    public async Task<Result<DepartmentDto>> Handle(CreateDepartmentCommand request, CancellationToken ct)
    {
        var department = Department.Create(request.Name, request.Code);
        _context.Departments.Add(department);
        await _context.SaveChangesAsync(ct);
        return Result<DepartmentDto>.Success(new DepartmentDto(department.Id, department.Name, department.Code, department.IsActive));
    }

    public async Task<Result<DepartmentDto>> Handle(UpdateDepartmentCommand request, CancellationToken ct)
    {
        var department = await _context.Departments.FindAsync(new object[] { request.Id }, ct);
        if (department == null) return Result<DepartmentDto>.Failure(Error.NotFound("Department.NotFound", "Department not found"));
        department.Update(request.Name, request.Code);
        await _context.SaveChangesAsync(ct);
        return Result<DepartmentDto>.Success(new DepartmentDto(department.Id, department.Name, department.Code, department.IsActive));
    }

    public async Task<Result<bool>> Handle(DeleteBrandCommand request, CancellationToken ct)
    {
        var brand = await _context.Brands.FindAsync(new object[] { request.Id }, ct);
        if (brand == null) return Result<bool>.Failure(Error.NotFound("Brand.NotFound", "Brand not found"));
        try
        {
            _context.Brands.Remove(brand);
            await _context.SaveChangesAsync(ct);
            return Result<bool>.Success(true);
        }
        catch (DbUpdateException)
        {
            return Result<bool>.Failure(Error.Validation("Brand.InUse", "Cannot delete brand because it is currently in use."));
        }
    }

    public async Task<Result<bool>> Handle(DeleteModelCommand request, CancellationToken ct)
    {
        var model = await _context.BrandModels.FindAsync(new object[] { request.Id }, ct);
        if (model == null) return Result<bool>.Failure(Error.NotFound("Model.NotFound", "Model not found"));
        try
        {
            _context.BrandModels.Remove(model);
            await _context.SaveChangesAsync(ct);
            return Result<bool>.Success(true);
        }
        catch (DbUpdateException)
        {
            return Result<bool>.Failure(Error.Validation("Model.InUse", "Cannot delete model because it is currently in use."));
        }
    }

    public async Task<Result<bool>> Handle(DeleteCategoryCommand request, CancellationToken ct)
    {
        var category = await _context.Categories.FindAsync(new object[] { request.Id }, ct);
        if (category == null) return Result<bool>.Failure(Error.NotFound("Category.NotFound", "Category not found"));
        try
        {
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync(ct);
            return Result<bool>.Success(true);
        }
        catch (DbUpdateException)
        {
            return Result<bool>.Failure(Error.Validation("Category.InUse", "Cannot delete category because it is currently in use."));
        }
    }

    public async Task<Result<bool>> Handle(DeleteDepartmentCommand request, CancellationToken ct)
    {
        var department = await _context.Departments.FindAsync(new object[] { request.Id }, ct);
        if (department == null) return Result<bool>.Failure(Error.NotFound("Department.NotFound", "Department not found"));
        try
        {
            _context.Departments.Remove(department);
            await _context.SaveChangesAsync(ct);
            return Result<bool>.Success(true);
        }
        catch (DbUpdateException)
        {
            return Result<bool>.Failure(Error.Validation("Department.InUse", "Cannot delete department because it is currently in use."));
        }
    }
}
