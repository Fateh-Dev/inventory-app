using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Queries.GetWarehouseById;

public class GetWarehouseByIdQueryHandler : IRequestHandler<GetWarehouseByIdQuery, Result<WarehouseDto>>
{
    private readonly StockDbContext _context;

    public GetWarehouseByIdQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<WarehouseDto>> Handle(GetWarehouseByIdQuery request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);

        if (warehouse == null)
            return Result<WarehouseDto>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID {request.Id} was not found."));

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
            IsActive = warehouse.IsActive
        };

        return Result<WarehouseDto>.Success(dto);
    }
}
