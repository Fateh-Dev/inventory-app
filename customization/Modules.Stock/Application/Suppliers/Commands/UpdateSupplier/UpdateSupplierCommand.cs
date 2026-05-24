using System;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Commands.UpdateSupplier;

public record UpdateSupplierCommand(
    Guid Id,
    string Name,
    string? ContactPerson,
    string? Phone,
    string? Email,
    string? Street,
    string? City,
    string? Wilaya,
    string? PostalCode,
    string? Notes
) : IRequest<Result<SupplierDto>>;
