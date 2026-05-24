using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Alerts.Commands.ResolveAlert;

public class ResolveAlertCommandHandler : IRequestHandler<ResolveAlertCommand, Result>
{
    private readonly StockDbContext _context;

    public ResolveAlertCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(ResolveAlertCommand request, CancellationToken cancellationToken)
    {
        var alert = await _context.StockAlerts.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);
        if (alert == null)
            return Result.Failure(Error.NotFound("Alert.NotFound", $"Alert with ID {request.Id} was not found."));

        alert.Resolve(request.Resolution);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
