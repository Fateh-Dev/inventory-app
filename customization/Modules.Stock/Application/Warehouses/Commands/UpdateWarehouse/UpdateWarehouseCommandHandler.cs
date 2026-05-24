using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.ValueObjects;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Commands.UpdateWarehouse;

public class UpdateWarehouseCommandHandler : IRequestHandler<UpdateWarehouseCommand, Result<WarehouseDto>>
{
    private readonly StockDbContext _context;

    public UpdateWarehouseCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<WarehouseDto>> Handle(UpdateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);
        if (warehouse == null)
            return Result<WarehouseDto>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID {request.Id} was not found."));

        var conflict = await _context.Warehouses.AnyAsync(w => w.Code == request.Code && w.Id != request.Id, cancellationToken);
        if (conflict)
            return Result<WarehouseDto>.Failure(Error.Conflict("Warehouse.CodeConflict", $"Warehouse code {request.Code} already exists."));

        var location = Address.Create(
            request.Street ?? string.Empty,
            request.City ?? string.Empty,
            request.Wilaya ?? string.Empty,
            request.PostalCode ?? string.Empty
        );

        warehouse.Update(
            request.Name,
            request.Code,
            location,
            request.ResponsiblePerson ?? string.Empty,
            request.Description
        );

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
            Description = warehouse.Description,
            IsActive = warehouse.IsActive,
            UpdatedAt = System.DateTime.UtcNow
        };

        return Result<WarehouseDto>.Success(dto);
    }
}
