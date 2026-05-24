using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.Alerts.Commands.MarkAlertRead;

public record MarkAlertReadCommand(Guid Id) : IRequest<Result>;
