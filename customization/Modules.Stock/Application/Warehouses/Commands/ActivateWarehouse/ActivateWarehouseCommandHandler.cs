using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Commands.ActivateWarehouse;

public class ActivateWarehouseCommandHandler : IRequestHandler<ActivateWarehouseCommand, Result>
{
    private readonly StockDbContext _context;

    public ActivateWarehouseCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(ActivateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);
        if (warehouse == null)
            return Result.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID {request.Id} was not found."));

        warehouse.Activate();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
