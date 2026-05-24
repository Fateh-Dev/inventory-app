using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.ValueObjects;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Commands.CreateWarehouse;

public class CreateWarehouseCommandHandler : IRequestHandler<CreateWarehouseCommand, Result<WarehouseDto>>
{
    private readonly StockDbContext _context;

    public CreateWarehouseCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<WarehouseDto>> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.Warehouses.AnyAsync(w => w.Code == request.Code, cancellationToken);
        if (existing)
            return Result<WarehouseDto>.Failure(Error.Conflict("Warehouse.CodeConflict", $"Warehouse code {request.Code} already exists."));

        var location = Address.Create(
            request.Street ?? string.Empty,
            request.City ?? string.Empty,
            request.Wilaya ?? string.Empty,
            request.PostalCode ?? string.Empty
        );

        var warehouse = Warehouse.Create(
            request.Name,
            request.Code,
            location,
            request.ResponsiblePerson ?? string.Empty
        );

        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new WarehouseDto
        {
            Id = warehouse.Id,
            Name = warehouse.Name,
            Code = warehouse.Code,
            Street = warehouse.Location.Street,
            City = warehouse.Location.City,
            Wilaya = warehouse.Location.Wilaya,
            PostalCode = warehouse.Location.PostalCode,
            ResponsiblePerson = warehouse.ResponsiblePerson,
            IsActive = warehouse.IsActive,
            CreatedAt = System.DateTime.UtcNow
        };

        return Result<WarehouseDto>.Success(dto);
    }
}
