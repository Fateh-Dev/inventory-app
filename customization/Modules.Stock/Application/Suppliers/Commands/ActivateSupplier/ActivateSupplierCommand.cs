using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Commands.ActivateSupplier;

public record ActivateSupplierCommand(Guid Id) : IRequest<Result>;
