using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Queries.GetSupplierById;

public class GetSupplierByIdQueryHandler : IRequestHandler<GetSupplierByIdQuery, Result<SupplierDto>>
{
    private readonly StockDbContext _context;

    public GetSupplierByIdQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SupplierDto>> Handle(GetSupplierByIdQuery request, CancellationToken cancellationToken)
    {
        var supplier = await _context.Suppliers.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (supplier == null)
            return Result<SupplierDto>.Failure(Error.NotFound("Supplier.NotFound", $"Supplier with ID {request.Id} was not found."));

        var dto = new SupplierDto
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
        };

        return Result<SupplierDto>.Success(dto);
    }
}
