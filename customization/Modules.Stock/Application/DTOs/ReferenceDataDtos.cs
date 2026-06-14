using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.DTOs;

public record BrandDto(Guid Id, string Name, bool IsActive);
public record BrandModelDto(Guid Id, Guid BrandId, string Name, bool IsActive);
public record CategoryDto(Guid Id, string Name, string? Code, bool IsActive);
public record DepartmentDto(Guid Id, string Name, string? Code, bool IsActive);

// Commands
public record CreateBrandCommand(string Name) : IRequest<Result<BrandDto>>;
public record UpdateBrandCommand(Guid Id, string Name) : IRequest<Result<BrandDto>>;
public record DeleteBrandCommand(Guid Id) : IRequest<Result<bool>>;

public record CreateModelCommand(Guid BrandId, string Name) : IRequest<Result<BrandModelDto>>;
public record UpdateModelCommand(Guid Id, string Name) : IRequest<Result<BrandModelDto>>;
public record DeleteModelCommand(Guid Id) : IRequest<Result<bool>>;

public record CreateCategoryCommand(string Name, string? Code) : IRequest<Result<CategoryDto>>;
public record UpdateCategoryCommand(Guid Id, string Name, string? Code) : IRequest<Result<CategoryDto>>;
public record DeleteCategoryCommand(Guid Id) : IRequest<Result<bool>>;

public record CreateDepartmentCommand(string Name, string Code) : IRequest<Result<DepartmentDto>>;
public record UpdateDepartmentCommand(Guid Id, string Name, string Code) : IRequest<Result<DepartmentDto>>;
public record DeleteDepartmentCommand(Guid Id) : IRequest<Result<bool>>;

// Queries
public record GetBrandsQuery : IRequest<Result<IEnumerable<BrandDto>>>;
public record GetModelsQuery(Guid? BrandId) : IRequest<Result<IEnumerable<BrandModelDto>>>;
public record GetCategoriesQuery : IRequest<Result<IEnumerable<CategoryDto>>>;
public record GetDepartmentsQuery : IRequest<Result<IEnumerable<DepartmentDto>>>;
