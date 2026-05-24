using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Commands.DeactivateWarehouse;

public class DeactivateWarehouseCommandHandler : IRequestHandler<DeactivateWarehouseCommand, Result>
{
    private readonly StockDbContext _context;

    public DeactivateWarehouseCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeactivateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);
        if (warehouse == null)
            return Result.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID {request.Id} was not found."));

        warehouse.Deactivate();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
