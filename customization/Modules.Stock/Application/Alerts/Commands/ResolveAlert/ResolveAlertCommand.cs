using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.Alerts.Commands.ResolveAlert;

public record ResolveAlertCommand(Guid Id, string Resolution) : IRequest<Result>;
