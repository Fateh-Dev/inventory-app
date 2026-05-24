using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Commands.DeactivateSupplier;

public class DeactivateSupplierCommandHandler : IRequestHandler<DeactivateSupplierCommand, Result>
{
    private readonly StockDbContext _context;

    public DeactivateSupplierCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeactivateSupplierCommand request, CancellationToken cancellationToken)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (supplier == null)
            return Result.Failure(Error.NotFound("Supplier.NotFound", $"Supplier with ID {request.Id} was not found."));

        supplier.Deactivate();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
