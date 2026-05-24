using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Queries.GetAllSuppliers;

public class GetAllSuppliersQueryHandler : IRequestHandler<GetAllSuppliersQuery, Result<IEnumerable<SupplierDto>>>
{
    private readonly StockDbContext _context;

    public GetAllSuppliersQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IEnumerable<SupplierDto>>> Handle(GetAllSuppliersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Suppliers.AsNoTracking();

        if (request.ActiveOnly.HasValue && request.ActiveOnly.Value)
        {
            query = query.Where(s => s.IsActive);
        }

        var suppliers = await query.ToListAsync(cancellationToken);

        var dtos = suppliers.Select(supplier => new SupplierDto
        {
            Id = supplier.Id,
            Name = supplier.Name,
            ContactPerson = supplier.ContactPerson,
            Phone = supplier.Phone,
            Email = supplier.Email,
            Street = supplier.Address.Street,
            City = supplier.Address.City,
            Wilaya = supplier.Address.Wilaya,
            PostalCode = supplier.Address.PostalCode,
            IsActive = supplier.IsActive,
            Notes = supplier.Notes
        });

        return Result<IEnumerable<SupplierDto>>.Success(dtos);
    }
}
