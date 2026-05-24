using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.ValueObjects;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Commands.CreateSupplier;

public class CreateSupplierCommandHandler : IRequestHandler<CreateSupplierCommand, Result<SupplierDto>>
{
    private readonly StockDbContext _context;

    public CreateSupplierCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SupplierDto>> Handle(CreateSupplierCommand request, CancellationToken cancellationToken)
    {
        var address = Address.Create(
            request.Street ?? string.Empty,
            request.City ?? string.Empty,
            request.Wilaya ?? string.Empty,
            request.PostalCode ?? string.Empty
        );

        var supplier = Supplier.Create(
            request.Name,
            request.ContactPerson ?? string.Empty,
            request.Phone ?? string.Empty,
            request.Email ?? string.Empty,
            address,
            request.Notes
        );

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync(cancellationToken);

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
            Notes = supplier.Notes,
            CreatedAt = System.DateTime.UtcNow
        };

        return Result<SupplierDto>.Success(dto);
    }
}
