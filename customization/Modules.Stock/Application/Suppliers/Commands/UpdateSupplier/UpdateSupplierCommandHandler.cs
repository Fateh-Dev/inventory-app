using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.ValueObjects;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Commands.UpdateSupplier;

public class UpdateSupplierCommandHandler : IRequestHandler<UpdateSupplierCommand, Result<SupplierDto>>
{
    private readonly StockDbContext _context;

    public UpdateSupplierCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SupplierDto>> Handle(UpdateSupplierCommand request, CancellationToken cancellationToken)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (supplier == null)
            return Result<SupplierDto>.Failure(Error.NotFound("Supplier.NotFound", $"Supplier with ID {request.Id} was not found."));

        var address = Address.Create(
            request.Street ?? string.Empty,
            request.City ?? string.Empty,
            request.Wilaya ?? string.Empty,
            request.PostalCode ?? string.Empty
        );

        supplier.Update(
            request.Name,
            request.ContactPerson ?? string.Empty,
            request.Phone ?? string.Empty,
            request.Email ?? string.Empty,
            address,
            request.Notes
        );

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
            UpdatedAt = System.DateTime.UtcNow
        };

        return Result<SupplierDto>.Success(dto);
    }
}
