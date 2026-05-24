using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Queries.GetAllWarehouses;

public class GetAllWarehousesQueryHandler : IRequestHandler<GetAllWarehousesQuery, Result<IEnumerable<WarehouseDto>>>
{
    private readonly StockDbContext _context;

    public GetAllWarehousesQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IEnumerable<WarehouseDto>>> Handle(GetAllWarehousesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Warehouses.AsNoTracking();

        if (request.ActiveOnly.HasValue && request.ActiveOnly.Value)
        {
            query = query.Where(w => w.IsActive);
        }

        var warehouses = await query.ToListAsync(cancellationToken);

        var dtos = warehouses.Select(w => new WarehouseDto
        {
            Id = w.Id,
            Name = w.Name,
            Code = w.Code,
            Street = w.Location.Street,
            City = w.Location.City,
            Wilaya = w.Location.Wilaya,
            PostalCode = w.Location.PostalCode,
            ResponsiblePerson = w.ResponsiblePerson,
            IsActive = w.IsActive
        });

        return Result<IEnumerable<WarehouseDto>>.Success(dtos);
    }
}
