# Manuale di Coding Guidelines .NET — Team TicketOne

* * *

## Indice

1.  [Introduzione e Obiettivi](#1-introduzione-e-obiettivi)
2.  [Principi Fondamentali di Qualità del Codice](#2-principi-fondamentali-di-qualit%C3%A0-del-codice)  
    2.1 [Leggibilità 🔴](#21-leggibilit%C3%A0-%F0%9F%94%B4)  
    2.2 [Semplicità 🔴](#22-semplicit%C3%A0-%F0%9F%94%B4)  
    2.3 [Alta Coesione 🔴](#23-alta-coesione-%F0%9F%94%B4)  
    2.4 [Basso Accoppiamento 🔴](#24-basso-accoppiamento-%F0%9F%94%B4)
3.  [Convenzioni di Naming](#3-convenzioni-di-naming)  
    3.1 [Regole Generali 🟡](#31-regole-generali-%F0%9F%9F%A1)  
    3.2 [Naming Semantico 🔴](#32-naming-semantico-%F0%9F%94%B4)
4.  [Principi OOP e Astrazione](#4-principi-oop-e-astrazione)  
    4.1 [Incapsulamento 🔴](#41-incapsulamento-%F0%9F%94%B4)  
    4.2 [Dipendere da Astrazioni (DIP) 🔴](#42-dipendere-da-astrazioni-dip-%F0%9F%94%B4)
5.  [Principi SOLID (Obbligatori)](#5-principi-solid-obbligatori)  
    5.1 [Single Responsibility Principle (SRP) 🔴](#51-single-responsibility-principle-srp-%F0%9F%94%B4)  
    5.2 [Open/Closed Principle (OCP) 🟡](#52-openclosed-principle-ocp-%F0%9F%9F%A1)  
    5.3 [Liskov Substitution Principle (LSP) 🟡](#53-liskov-substitution-principle-lsp-%F0%9F%9F%A1)  
    5.4 [Interface Segregation Principle (ISP) 🟡](#54-interface-segregation-principle-isp-%F0%9F%9F%A1)  
    5.5 [Dependency Inversion Principle (DIP) 🔴](#55-dependency-inversion-principle-dip-%F0%9F%94%B4)
6.  [DRY, KISS, YAGNI e Pattern Comuni](#6-dry-kiss-yagni-e-pattern-comuni)  
    6.1 [DRY (Don't Repeat Yourself) 🔴](#61-dry-dont-repeat-yourself-%F0%9F%94%B4)  
    6.2 [KISS (Keep It Simple, Stupid) 🟡](#62-kiss-keep-it-simple-stupid-%F0%9F%9F%A1)  
    6.3 [YAGNI (You Aren't Gonna Need It) 🟡](#63-yagni-you-arent-gonna-need-it-%F0%9F%9F%A1)  
    6.4 [Pattern Comuni 🟡](#64-pattern-comuni-%F0%9F%9F%A1)
7.  [Clean Code e Tidy Code](#7-clean-code-e-tidy-code)  
    7.1 [Metodi Brevi con Singola Responsabilità 🔴](#71-metodi-brevi-con-singola-responsabilit%C3%A0-%F0%9F%94%B4)  
    7.2 [Guard Clauses (Early Return) 🔴](#72-guard-clauses-early-return-%F0%9F%94%B4)  
    7.3 [Evitare Magic Numbers/Strings 🔴](#73-evitare-magic-numbersstrings-%F0%9F%94%B4)  
    7.4 [Commenti: Quando e Come 🟡](#74-commenti-quando-e-come-%F0%9F%9F%A1)
8.  [Gestione degli Errori, Logging Strutturato e Tracing](#8-gestione-degli-errori-logging-strutturato-e-tracing)  
    8.1 [Logging Strutturato (JSON) 🔴](#81-logging-strutturato-json-%F0%9F%94%B4)  
    8.2 [OpenTelemetry e TraceId 🔴](#82-opentelemetry-e-traceid-%F0%9F%94%B4)  
    8.3 [Result Pattern 🟡](#83-result-pattern-%F0%9F%9F%A1)  
    8.4 [Gerarchia delle Eccezioni 🟡](#84-gerarchia-delle-eccezioni-%F0%9F%9F%A1)
9.  [Pattern Architetturali](#9-pattern-architetturali)  
    9.1 [Result Pattern](#91-result-pattern)  
    9.2 [Mediator Pattern (MediatR) 🟡](#92-mediator-pattern-mediatr-%F0%9F%9F%A1)  
    9.3 [CQRS 🟡](#93-cqrs-%F0%9F%9F%A1)  
    9.4 [Domain-Driven Design (DDD) 🟡](#94-domain-driven-design-ddd-%F0%9F%9F%A1)
10. [Pattern di Resilienza](#10-pattern-di-resilienza)  
    10.1 [Circuit Breaker 🔴](#101-circuit-breaker-%F0%9F%94%B4)  
    10.2 [Retry con Exponential Backoff 🔴](#102-retry-con-exponential-backoff-%F0%9F%94%B4)  
    10.3 [Bulkhead Pattern 🟡](#103-bulkhead-pattern-%F0%9F%9F%A1)  
    10.4 [Timeout Policy 🔴](#104-timeout-policy-%F0%9F%94%B4)  
    10.5 [Policy Combinate (Wrap) 🟡](#105-policy-combinate-wrap-%F0%9F%9F%A1)
11. [Performance e Ottimizzazione](#11-performance-e-ottimizzazione)  
    11.1 [Async/Await Best Practices 🔴](#111-asyncawait-best-practices-%F0%9F%94%B4)  
    11.2 [Ottimizzazione Query EF Core 🔴](#112-ottimizzazione-query-ef-core-%F0%9F%94%B4)  
    11.3 [Caching 🟡](#113-caching-%F0%9F%9F%A1)  
    11.4 [Memory Management 🟡](#114-memory-management-%F0%9F%9F%A1)
12. [Librerie Condivise e Riuso](#12-librerie-condivise-e-riuso)  
    12.1 [Dove creare librerie condivise](#121-dove-creare-librerie-condivise)  
    12.2 [Extension Methods Condivisi 🟡](#122-extension-methods-condivisi-%F0%9F%9F%A1)  
    12.3 [Guard Clauses Centralizzate 🟡](#123-guard-clauses-centralizzate-%F0%9F%9F%A1)
13. [Observability: OpenTelemetry e Keep-Alive](#13-observability-opentelemetry-e-keep-alive)
14. [Unit Testing e Testabilità](#14-unit-testing-e-testabilit%C3%A0)
15. [Checklist PR / Commit (.NET TicketOne)](#15-checklist-pr--commit-net-ticketone)
16. [Riferimenti e Risorse](#16-riferimenti-e-risorse)

* * *

## 1\. Introduzione e Obiettivi

Questo manuale definisce le **linee guida obbligatorie e raccomandate** per la scrittura di codice .NET nel contesto della piattaforma TicketOne. L'obiettivo è garantire:

- **Manutenibilità**: codice facile da comprendere, modificare ed estendere.
- **Affidabilità**: sistemi robusti che gestiscono correttamente errori e condizioni limite.
- **Performance**: soluzioni efficienti che supportano i picchi di traffico tipici degli on-sale.
- **Sicurezza**: codice che rispetta i principi di security by design e le policy Eventim.
- **Coerenza**: stile uniforme che facilita collaborazione e code review trasversali ai team.

### Legenda

| Simbolo | Significato |
| --- | --- |
| 🔴 **OBBLIGATORIO** | Violazione bloccante in code review |
| 🟡 **CONSIGLIATO** | Best practice fortemente raccomandata |
| 🟢 **OPZIONALE** | Suggerimento per casi specifici |

* * *

## 2\. Principi Fondamentali di Qualità del Codice

Un codice ben scritto presenta le seguenti caratteristiche.

### 2.1 Leggibilità 🔴

```csharp
// ❌ MALE: Cosa fa questo codice?
var x = db.T.Where(t => t.S == 1 && t.D < DateTime.Now)
    .Select(t => new { t.I, t.P })
    .ToList();

// ✅ BENE: Chiaro e auto-documentante
var availableTickets = _ticketRepository
    .GetAll()
    .Where(ticket => ticket.Status == TicketStatus.Available)
    .Where(ticket => ticket.EventDate < DateTime.UtcNow)
    .Select(ticket => new TicketSummaryDto(ticket.Id, ticket.Price))
    .ToList();
```

### 2.2 Semplicità 🔴

> “La perfezione si raggiunge non quando non c'è più nulla da aggiungere, ma quando non c'è più nulla da togliere.” — Antoine de Saint-Exupéry

```csharp
// ❌ MALE: Complessità inutile
public bool IsValidTicket(Ticket ticket)
{
    if (ticket != null)
    {
        if (ticket.Status == TicketStatus.Valid)
        {
            if (ticket.ExpirationDate > DateTime.UtcNow)
            {
                return true;
            }
        }
    }

    return false;
}

// ✅ BENE: Early return e guard clauses
public bool IsValidTicket(Ticket ticket)
{
    if (ticket is null) return false;
    if (ticket.Status != TicketStatus.Valid) return false;
    if (ticket.ExpirationDate <= DateTime.UtcNow) return false;

    return true;
}
```

### 2.3 Alta Coesione 🔴

Ogni classe/metodo/modulo deve avere un’unica responsabilità ben definita (vedi SRP).

### 2.4 Basso Accoppiamento 🔴

Le dipendenze tra moduli devono essere minime e gestite tramite astrazioni (interfacce + Dependency Injection).

* * *

## 3\. Convenzioni di Naming

### 3.1 Regole Generali 🟡

| Elemento | Convenzione | Esempio |
| --- | --- | --- |
| Namespace | PascalCase, gerarchico | `TicketOne.Sales.Orders` |
| Classe/Struct | PascalCase, sostantivo | `OrderService` |
| Interfaccia | PascalCase con prefisso `I` | `IOrderRepository` |
| Metodo | PascalCase, verbo | `CreateOrder()` |
| Proprietà | PascalCase | `OrderId` |
| Parametro/Variabile | camelCase | `orderId` |
| Campo privato | `_camelCase` | `_orderRepository` |
| Costante | PascalCase | `MaxTicketsPerOrder` |
| Evento | PascalCase, tempo passato | `OrderCreated` |
| EndPoint/Api esposta | camelCase | createOperator |

### 3.2 Naming Semantico 🔴

```csharp
// ❌ MALE: Nomi generici o criptici
var d = GetData();
var temp = Process(d);
var mgr = new Mgr();

// ✅ BENE: Nomi descrittivi che rivelano l'intento
var availableSeats = GetAvailableSeatsForEvent(eventId);
var validatedOrder = ValidateOrderRules(order);
var ticketEmissionService = new TicketEmissionService();
```

* * *

## 4\. Principi OOP e Astrazione

### 4.1 Incapsulamento 🔴

```csharp
// ❌ MALE: Stato interno esposto
public class Order
{
    public List<OrderItem> Items = new(); // Campo pubblico
    public decimal Total;                 // Nessun controllo
}

// ✅ BENE: Stato protetto e comportamento esplicito
public class Order
{
    private readonly List<OrderItem> _items = new();

    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
    public decimal Total { get; private set; }

    public void AddItem(OrderItem item)
    {
        if (item is null)
            throw new ArgumentNullException(nameof(item));

        if (_items.Count >= MaxItemsPerOrder)
            throw new OrderLimitExceededException();

        _items.Add(item);
        RecalculateTotal();
    }

    private void RecalculateTotal() =>
        Total = _items.Sum(i => i.Price * i.Quantity);
}
```

### 4.2 Dipendere da Astrazioni (DIP) 🔴

```csharp
// ❌ MALE: Dipendenza da implementazione concreta
public class OrderService
{
    private readonly SqlOrderRepository _repository = new SqlOrderRepository();
}

// ✅ BENE: Dipendenza da astrazione (Dependency Injection)
public class OrderService
{
    private readonly IOrderRepository _repository;

    public OrderService(IOrderRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }
}
```

* * *

## 5\. Principi SOLID (Obbligatori)

I principi SOLID sono **OBBLIGATORI** per tutto il codice di produzione. Non sono un dogma al 100% in ogni riga, ma sono l’obiettivo da perseguire stabilmente. La **S (Single Responsibility)** è prioritaria.

### 5.1 Single Responsibility Principle (SRP) — IL PIÙ IMPORTANTE 🔴

> Una classe deve avere una e una sola ragione per cambiare.

Vale per metodi, classi, progetti e microservizi. Metodi e classi devono essere il più brevi possibile compatibilmente con la leggibilità.

```csharp
// ❌ MALE: Classe con responsabilità multiple
public class OrderManager
{
    public Order CreateOrder(CreateOrderRequest request) { /* logica */ }
    public void ValidatePayment(Payment payment) { /* logica */ }
    public void SendConfirmationEmail(Order order) { /* logica */ }
    public void UpdateInventory(Order order) { /* logica */ }
    public string GeneratePdfTicket(Order order) { /* logica */ }
    public void LogOrderToDatabase(Order order) { /* logica */ }
}

// ✅ BENE: Responsabilità separate
public class OrderCreationService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IOrderValidator _validator;

    public async Task<Result<Order>> CreateOrderAsync(CreateOrderCommand command)
    {
        var validationResult = await _validator.ValidateAsync(command);
        if (!validationResult.IsValid)
            return Result.Failure<Order>(validationResult.Errors);

        var order = Order.Create(command);
        await _orderRepository.AddAsync(order);

        return Result.Success(order);
    }
}

public class PaymentValidationService { /* solo validazione pagamenti */ }
public class EmailNotificationService { /* solo invio email */ }
public class InventoryService { /* solo gestione inventario */ }
public class TicketPdfGenerator { /* solo generazione PDF */ }
```

**Test SRP**: se non riesci a descrivere cosa fa una classe in **una frase** senza “e”/“o”, probabilmente viola SRP.

### 5.2 Open/Closed Principle (OCP) 🟡

> Aperto all'estensione, chiuso alla modifica.

```csharp
// ❌ MALE: Ogni nuovo tipo richiede modifica
public class DiscountCalculator
{
    public decimal Calculate(Order order, string discountType)
    {
        return discountType switch
        {
            "percentage" => order.Total * 0.1m,
            "fixed"      => 10m,
            "loyalty"    => order.Total * 0.15m,
            _            => 0m
        };
    }
}

// ✅ BENE: Estensibile senza modifiche
public interface IDiscountStrategy
{
    decimal Calculate(Order order);
}

public class PercentageDiscount : IDiscountStrategy
{
    private readonly decimal _percentage;
    public PercentageDiscount(decimal percentage) => _percentage = percentage;

    public decimal Calculate(Order order) => order.Total * _percentage;
}

public class LoyaltyDiscount : IDiscountStrategy
{
    public decimal Calculate(Order order) => order.Total * 0.15m;
}

public class DiscountCalculator
{
    public decimal Calculate(Order order, IDiscountStrategy strategy) =>
        strategy.Calculate(order);
}
```

### 5.3 Liskov Substitution Principle (LSP) 🟡

> I sottotipi devono essere sostituibili ai loro tipi base.

```csharp
// ❌ MALE: Violazione LSP
public class Bird
{
    public virtual void Fly() => Console.WriteLine("Flying");
}

public class Penguin : Bird
{
    public override void Fly() =>
        throw new NotSupportedException("Penguins can't fly!");
}

// ✅ BENE: Gerarchia corretta
public interface IFlyable
{
    void Fly();
}

public abstract class Bird
{
    public abstract void Move();
}

public class Sparrow : Bird, IFlyable
{
    public override void Move() => Fly();
    public void Fly() => Console.WriteLine("Flying");
}

public class Penguin : Bird
{
    public override void Move() => Console.WriteLine("Swimming");
}
```

### 5.4 Interface Segregation Principle (ISP) 🟡

> Nessun client dovrebbe dipendere da metodi che non usa.

Segmentare interfacce grosse in interfacce piccole e specifiche per il client.

### 5.5 Dependency Inversion Principle (DIP) 🔴

> Dipendere dalle astrazioni, non dalle implementazioni concrete.

```csharp
// ❌ MALE: Dipendenza diretta
public class OrderService
{
    private readonly SqlOrderRepository _repo = new();
    private readonly SmtpEmailSender _email = new();
}

// ✅ BENE: Iniezione di dipendenze tramite astrazioni
public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IOrderRepository repository,
        IEmailSender emailSender,
        ILogger<OrderService> logger)
    {
        _repository = repository;
        _emailSender = emailSender;
        _logger = logger;
    }
}

// Registrazione DI container
services.AddScoped<IOrderRepository, SqlOrderRepository>();
services.AddScoped<IEmailSender, SmtpEmailSender>();
services.AddScoped<OrderService>();
```

* * *

## 6\. DRY, KISS, YAGNI e Pattern Comuni

### 6.1 DRY (Don't Repeat Yourself) 🔴

```csharp
// ❌ MALE: Logica duplicata
public class EventService
{
    public bool IsEventAvailable(Event evt)
        => evt.Status == EventStatus.Published
           && evt.StartDate > DateTime.UtcNow
           && evt.AvailableSeats > 0;
}

public class TicketService
{
    public bool CanSellTicket(Event evt)
        => evt.Status == EventStatus.Published
           && evt.StartDate > DateTime.UtcNow
           && evt.AvailableSeats > 0; // duplicato
}

// ✅ BENE: Logica nel dominio
public class Event
{
    public bool IsAvailableForSale =>
        Status == EventStatus.Published
        && StartDate > DateTime.UtcNow
        && AvailableSeats > 0;
}

// Utilizzo
if (eventEntity.IsAvailableForSale)
{
    // ...
}
```

### 6.2 KISS (Keep It Simple, Stupid) 🟡

Preferire la soluzione più semplice che soddisfa i requisiti attuali. Evitare astrazioni premature, generalizzazioni non necessarie e metaprogrammazione superflua.

### 6.3 YAGNI (You Aren't Gonna Need It) 🟡

Non implementare ora funzionalità “perché un giorno potrebbe servire”. Se il requisito non è attuale, non si implementa.

### 6.4 Pattern Comuni 🟡

Pattern consigliati (da usare quando aggiungono valore reale):

- **Repository**: solo se aggiunge reale astrazione rispetto a `DbContext` diretto (multi-store, testabilità, query complesse).
- **Factory/Builder**: per oggetti complessi (es. ordini con molte righe e politiche).
- **Adapter**: per integrare servizi legacy (SETA, MAI, VRO) nascondendo dettagli tecnici.
- **Strategy**: per regole variabili (pricing, policy di annullo, antifrode).
- **Dependency Injection**: obbligatoria per servizi/domain logic; vietato `new` “duro” nelle classi di business.

* * *

## 7\. Clean Code e Tidy Code

### 7.1 Metodi Brevi con Singola Responsabilità 🔴

> Un metodo dovrebbe fare UNA cosa, farla bene, e farla soltanto (vedi SRP).

Se il metodo supera ~20–30 righe o ha troppi `if/else`, valutare refactoring.

### 7.2 Guard Clauses (Early Return) 🔴

```csharp
// ❌ MALE: Nesting profondo
public async Task<Ticket> GetTicketAsync(Guid ticketId, Guid userId)
{
    if (ticketId != Guid.Empty)
    {
        var ticket = await _repository.GetByIdAsync(ticketId);
        if (ticket != null)
        {
            if (ticket.OwnerId == userId)
            {
                if (ticket.Status == TicketStatus.Valid)
                {
                    return ticket;
                }
                throw new InvalidTicketException();
            }

            throw new UnauthorizedException();
        }

        throw new NotFoundException();
    }

    throw new ArgumentException(nameof(ticketId));
}

// ✅ BENE: Guard clauses con early return
public async Task<Ticket> GetTicketAsync(Guid ticketId, Guid userId)
{
    if (ticketId == Guid.Empty)
        throw new ArgumentException("Invalid ticket ID", nameof(ticketId));

    var ticket = await _repository.GetByIdAsync(ticketId);

    if (ticket is null)
        throw new TicketNotFoundException(ticketId);

    if (ticket.OwnerId != userId)
        throw new UnauthorizedAccessException("User does not own this ticket");

    if (ticket.Status != TicketStatus.Valid)
        throw new InvalidTicketStatusException(ticket.Status);

    return ticket;
}
```

### 7.3 Evitare Magic Numbers/Strings 🔴

```csharp
// ❌ MALE: Valori magici
if (order.Items.Count > 10) { /* ... */ }
if (user.Role == "admin") { /* ... */ }
if (retryCount < 3) { /* ... */ }

// ✅ BENE: Costanti nominate
public static class OrderLimits
{
    public const int MaxItemsPerOrder = 10;
    public const int MaxTicketsPerEvent = 4;
}

public static class UserRoles
{
    public const string Admin    = "admin";
    public const string Operator = "operator";
}

public static class ResiliencePolicy
{
    public const int MaxRetryAttempts = 3;
    public static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(2);
}
```

### 7.4 Commenti: Quando e Come 🟡

- **NO**: commenti che spiegano il *cosa* fa il codice (il codice deve essere auto-esplicativo).
- **SÌ**: commenti che spiegano il *perché*, decisioni non ovvie, workaround, vincoli normativi.

```csharp
// SIAE richiede un ritardo minimo di 100ms tra richieste consecutive
// per evitare il rate limiting sul servizio di firma
await Task.Delay(SiaeServiceLimits.MinRequestInterval);

// Workaround per bug nel provider di pagamento KPS (ticket #12345)
// che restituisce codice 200 anche in caso di timeout interno
if (response.StatusCode == HttpStatusCode.OK &&
    response.Body.Contains("TIMEOUT", StringComparison.OrdinalIgnoreCase))
{
    return PaymentResult.Timeout;
}
```

* * *

## 8\. Gestione degli Errori, Logging Strutturato e Tracing

### 8.1 Logging Strutturato (JSON) 🔴

Il logging **DEVE** seguire il formato JSON come da linee guida Eventim. Output su `stdout`, niente file rollati a mano.

```csharp
// Configurazione Serilog
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("service.name", "ticketone-orders-api")
    .Enrich.WithProperty(
        "deployment.environment",
        Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"))
    .WriteTo.Console(new JsonFormatter())
    .CreateLogger();
```

```csharp
// Utilizzo corretto
public class OrderService
{
    private readonly ILogger<OrderService> _logger;

    public async Task<Result<Order>> CreateOrderAsync(CreateOrderCommand command)
    {
        using var activity = ActivitySource.StartActivity("CreateOrder");

        _logger.LogInformation(
            "Creating order for customer {CustomerId} with {ItemCount} items",
            command.CustomerId,
            command.Items.Count);

        try
        {
            var order = await ProcessOrderAsync(command);

            _logger.LogInformation(
                "Order {OrderId} created successfully. Total: {OrderTotal}",
                order.Id,
                order.Total);

            return Result.Success(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to create order for customer {CustomerId}. Error: {ErrorMessage}",
                command.CustomerId,
                ex.Message);

            throw;
        }
    }
}
```

**Campi minimi consigliati nel log JSON:**

```json
{
  "@timestamp": "2025-12-11T10:30:00.000Z",
  "level": "Information",
  "message": "Order ORD-12345 created successfully",
  "service.name": "ticketone-orders-api",
  "deployment.environment": "production",
  "trace_id": "abc123def456",
  "span_id": "xyz789",
  "CustomerId": "CUST-001",
  "OrderId": "ORD-12345",
  "OrderTotal": 150.00
}
```

### 8.2 OpenTelemetry e TraceId 🔴

**Perché OpenTelemetry invece di gestire a mano i `traceId`?**

- OpenTelemetry è lo standard Eventim per tracing distribuito.
- Gestisce automaticamente **trace id**, **span id** e **propagazione del contesto** tra microservizi (HTTP, gRPC, messaggi).
- Se ogni servizio usa OpenTelemetry, possiamo tracciare un flusso end‑to‑end (es. acquisto biglietto) anche attraversando orchestratore, payment gateway, ticketing engine, microservizi vari.

**Regola:**

- Usa **OpenTelemetry** per tracing;
- nei log, includi sempre `trace_id` e `span_id` presi da `Activity.Current` (gestito da OTel).

Esempio di setup minimale:

```csharp
// Program.cs - setup OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddSource("TicketOne.Orders") // ActivitySource
            .AddOtlpExporter(); // O altra destinazione configurata
    });
```

Nel codice:

```csharp
private static readonly ActivitySource ActivitySource = new("TicketOne.Orders");

public async Task<Result<Order>> CreateOrderAsync(CreateOrderCommand command)
{
    using var activity = ActivitySource.StartActivity("CreateOrder");

    // Serilog/ILogger, grazie a Enrich.FromLogContext, può arricchire i log con trace_id/span_id
    // se nel middleware mettiamo le proprietà corrette nel LogContext
    // (vedi CorrelationIdMiddleware a livello di servizio)
}
```

### 8.3 Result Pattern 🟡

Il Result Pattern è **consigliato** in generale ma **OBBLIGATORIO nelle nuove implementazioni** per tutte le operazioni che possono fallire in modo “atteso” (validazione, business rules, non trovato, concorrenza, ecc.).

```csharp
public class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public Error Error { get; }

    protected Result(bool isSuccess, Error error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, Error.None);
    public static Result Failure(Error error) => new(false, error);
    public static Result<T> Success<T>(T value) => new(value, true, Error.None);
    public static Result<T> Failure<T>(Error error) => new(default!, false, error);
}

public class Result<T> : Result
{
    public T Value { get; }

    protected internal Result(T value, bool isSuccess, Error error)
        : base(isSuccess, error)
    {
        Value = value;
    }
}

public record Error(string Code, string Message)
{
    public static readonly Error None      = new(string.Empty, string.Empty);
    public static readonly Error NullValue = new("Error.NullValue", "Value cannot be null");
}

// Domain Errors
public static class DomainErrors
{
    public static class Order
    {
        public static Error NotFound(Guid id) =>
            new("Order.NotFound", $"Order with ID {id} was not found");

        public static readonly Error AlreadyCancelled =
            new("Order.AlreadyCancelled", "Cannot modify a cancelled order");

        public static Error ExceedsTicketLimit(int limit) =>
            new("Order.ExceedsTicketLimit", $"Cannot order more than {limit} tickets");
    }

    public static class Seat
    {
        public static Error NotAvailable(string seatId) =>
            new("Seat.NotAvailable", $"Seat {seatId} is no longer available");

        public static readonly Error LockExpired =
            new("Seat.LockExpired", "Your seat reservation has expired");
    }

    public static class Customer
    {
        public static Error NotFound(Guid id) =>
            new("Customer.NotFound", $"Customer with ID {id} was not found");
    }
}
```

Esempio utilizzo:

```csharp
public class CreateOrderCommandHandler 
    : IRequestHandler<CreateOrderCommand, Result<OrderDto>>
{
    public async Task<Result<OrderDto>> Handle(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(command.CustomerId);
        if (customer is null)
            return Result.Failure<OrderDto>(
                DomainErrors.Customer.NotFound(command.CustomerId));

        var seatsResult = await _seatService.ReserveSeatsAsync(command.SeatIds);
        if (seatsResult.IsFailure)
            return Result.Failure<OrderDto>(seatsResult.Error);

        var order = Order.Create(customer, seatsResult.Value);
        await _orderRepository.AddAsync(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(order.ToDto());
    }
}
```

### 8.4 Gerarchia delle Eccezioni 🟡

Usare eccezioni di dominio solo per errori **non attesi / eccezionali**; per flussi normali usare `Result`.

```csharp
public abstract class DomainException : Exception
{
    public string Code { get; }

    protected DomainException(string code, string message) : base(message)
    {
        Code = code;
    }
}

public class EntityNotFoundException : DomainException
{
    public EntityNotFoundException(string entityName, object id)
        : base("Entity.NotFound", $"{entityName} with ID '{id}' was not found")
    { }
}

public class BusinessRuleViolationException : DomainException
{
    public BusinessRuleViolationException(string rule, string details)
        : base("BusinessRule.Violation", $"Business rule '{rule}' violated: {details}")
    { }
}
```

* * *

## 9\. Pattern Architetturali

Pattern consigliati soprattutto nelle nuove implementazioni.

### 9.1 Result Pattern

Già trattato in [8.3](#83-result-pattern-%F0%9F%9F%A1).

### 9.2 Mediator Pattern (MediatR) 🟡

MediatR è lo standard per disaccoppiare controller e business logic (comandi/query).

```csharp
public record CreateOrderCommand(
    Guid CustomerId,
    List<OrderItemDto> Items) : IRequest<Result<OrderDto>>;

public class CreateOrderCommandHandler 
    : IRequestHandler<CreateOrderCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateOrderCommandHandler> _logger;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        IUnitOfWork unitOfWork,
        ILogger<CreateOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<OrderDto>> Handle(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Processing CreateOrderCommand for customer {CustomerId}",
            command.CustomerId);

        var order = Order.Create(command.CustomerId, command.Items);

        await _orderRepository.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(order.ToDto());
    }
}
```

### 9.3 CQRS (Command Query Responsibility Segregation) 🟡

Separare scritture (Commands) da letture (Queries), soprattutto per domini complessi o con carichi lettura»scrittura.

```csharp
public record CancelOrderCommand(Guid OrderId) : IRequest<Result>;

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, Result>
{
    private readonly IOrderRepository _repository;

    public async Task<Result> Handle(CancelOrderCommand command, CancellationToken ct)
    {
        var order = await _repository.GetByIdAsync(command.OrderId, ct);
        if (order is null)
            return Result.Failure(DomainErrors.Order.NotFound(command.OrderId));

        var cancelResult = order.Cancel();
        if (cancelResult.IsFailure)
            return cancelResult;

        await _repository.UpdateAsync(order, ct);
        return Result.Success();
    }
}
```

### 9.4 Domain-Driven Design (DDD) 🟡

Applicare DDD nei bounded context con regole di business articolate (vedi documento dedicato, non ripetuto qui per brevità).

* * *

## 10\. Pattern di Resilienza

Tutti i servizi che chiamano sistemi esterni (pagamenti, SETA, ecc.) devono usare pattern di resilienza basati su **Polly**.

### 10.1 Circuit Breaker 🔴

```csharp
services.AddHttpClient<IPaymentGatewayClient, PaymentGatewayClient>()
    .AddPolicyHandler(GetCircuitBreakerPolicy());

private static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .OrResult(msg => msg.StatusCode == HttpStatusCode.TooManyRequests)
        .CircuitBreakerAsync(
            handledEventsAllowedBeforeBreaking: 5,
            durationOfBreak: TimeSpan.FromSeconds(30),
            onBreak: (outcome, breakDelay) =>
            {
                Log.Warning(
                    "Circuit breaker opened for {BreakDelay}s due to {Reason}",
                    breakDelay.TotalSeconds,
                    outcome.Exception?.Message ?? outcome.Result.StatusCode.ToString());
            },
            onReset: () => Log.Information("Circuit breaker reset"),
            onHalfOpen: () => Log.Information("Circuit breaker half-open, testing...")
        );
}
```

### 10.2 Retry con Exponential Backoff 🔴

```csharp
services.AddHttpClient<ISiaeService, SiaeService>()
    .AddPolicyHandler(GetRetryPolicy());

private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    var jitter = new Random();

    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(
            retryCount: 3,
            sleepDurationProvider: (retryAttempt, context) =>
            {
                var exponentialDelay = TimeSpan.FromSeconds(Math.Pow(2, retryAttempt));
                var jitterDelay = TimeSpan.FromMilliseconds(jitter.Next(0, 1000));
                return exponentialDelay + jitterDelay;
            },
            onRetry: (outcome, timespan, retryAttempt, context) =>
            {
                Log.Warning(
                    "Retry {RetryAttempt} after {Delay}ms. Error: {Error}",
                    retryAttempt,
                    timespan.TotalMilliseconds,
                    outcome.Exception?.Message ?? outcome.Result.StatusCode.ToString());
            });
}
```

### 10.3 Bulkhead Pattern 🟡

```csharp
services.AddHttpClient<ITicketEmissionService, TicketEmissionService>()
    .AddPolicyHandler(
        Policy.BulkheadAsync<HttpResponseMessage>(
            maxParallelization: 10,
            maxQueuingActions: 25,
            onBulkheadRejectedAsync: context =>
            {
                Log.Warning("Bulkhead rejected request - service overloaded");
                return Task.CompletedTask;
            }));
```

### 10.4 Timeout Policy 🔴

```csharp
services.AddHttpClient<IPaymentGatewayClient, PaymentGatewayClient>()
    .AddPolicyHandler(
        Policy.TimeoutAsync<HttpResponseMessage>(
            TimeSpan.FromSeconds(10),
            TimeoutStrategy.Optimistic,
            onTimeoutAsync: (context, timespan, task) =>
            {
                Log.Warning("Payment gateway timeout after {Timeout}s", timespan.TotalSeconds);
                return Task.CompletedTask;
            }));
```

### 10.5 Policy Combinate (Wrap) 🟡

```csharp
var retryPolicy          = GetRetryPolicy();
var circuitBreakerPolicy = GetCircuitBreakerPolicy();
var timeoutPolicy        = Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(10));
var bulkheadPolicy       = Policy.BulkheadAsync<HttpResponseMessage>(10, 25);

var combinedPolicy = Policy.WrapAsync(
    bulkheadPolicy,
    timeoutPolicy,
    retryPolicy,
    circuitBreakerPolicy);

services.AddHttpClient<IExternalService, ExternalService>()
    .AddPolicyHandler(combinedPolicy);
```

* * *

## 11\. Performance e Ottimizzazione

### 11.1 Async/Await Best Practices 🔴

```csharp
// ❌ MALE: Blocco sincrono
public Order GetOrder(Guid id)
{
    return _repository.GetByIdAsync(id).Result; // DEADLOCK RISK!
}

// ❌ MALE: async void (eccetto event handlers)
public async void ProcessOrder(Order order)
{
    await _service.ProcessAsync(order); // Eccezioni non catturabili!
}

// ❌ MALE: await non necessario
public async Task<Order> GetOrderAsync(Guid id)
{
    return await _repository.GetByIdAsync(id); // Overhead inutile
}

// ✅ BENE: Passthrough diretto
public Task<Order> GetOrderAsync(Guid id)
{
    return _repository.GetByIdAsync(id);
}

// ✅ BENE: ConfigureAwait(false) in librerie
public async Task<Order> GetOrderAsync(Guid id)
{
    var order = await _repository.GetByIdAsync(id).ConfigureAwait(false);
    return order;
}

// ✅ BENE: Parallelismo quando appropriato
public async Task<OrderSummary> GetOrderSummaryAsync(Guid orderId)
{
    var orderTask    = _orderRepository.GetByIdAsync(orderId);
    var customerTask = _customerRepository.GetByIdAsync(order.CustomerId);
    var paymentsTask = _paymentRepository.GetByOrderIdAsync(orderId);

    await Task.WhenAll(orderTask, customerTask, paymentsTask);

    return new OrderSummary(orderTask.Result, customerTask.Result, paymentsTask.Result);
}
```

### 11.2 Ottimizzazione Query EF Core 🔴

```csharp
// ❌ MALE: N+1 Query
public async Task<IEnumerable<OrderDto>> GetOrdersAsync()
{
    var orders = await _context.Orders.ToListAsync();
    foreach (var order in orders)
    {
        order.Items = await _context.OrderItems
            .Where(i => i.OrderId == order.Id)
            .ToListAsync(); // N query aggiuntive!
    }
    return orders.Select(o => o.ToDto());
}

// ✅ BENE: Include esplicito
public async Task<IEnumerable<OrderDto>> GetOrdersAsync()
{
    return await _context.Orders
        .Include(o => o.Items)
        .Include(o => o.Customer)
        .AsNoTracking() // Read-only: skip change tracking
        .Select(o => new OrderDto(o.Id, o.Total, o.Items.Count))
        .ToListAsync();
}

// ✅ BENE: Proiezione diretta (più efficiente)
public async Task<IEnumerable<OrderSummaryDto>> GetOrderSummariesAsync()
{
    return await _context.Orders
        .Select(o => new OrderSummaryDto
        {
            Id           = o.Id,
            CustomerName = o.Customer.Name,
            Total        = o.Total,
            ItemCount    = o.Items.Count
        })
        .ToListAsync();
}

// ✅ BENE: Paginazione server-side
public async Task<PagedResult<OrderDto>> GetOrdersPagedAsync(int page, int pageSize)
{
    var query = _context.Orders.AsNoTracking();

    var totalCount = await query.CountAsync();
    var items = await query
        .OrderByDescending(o => o.CreatedAt)
        .Skip(page * pageSize)
        .Take(pageSize)
        .Select(o => o.ToDto())
        .ToListAsync();

    return new PagedResult<OrderDto>(items, totalCount, page, pageSize);
}
```

### 11.3 Caching 🟡

```csharp
// Cache distribuita (Redis)
public class CachedEventRepository : IEventRepository
{
    private readonly IEventRepository _inner;
    private readonly IDistributedCache _cache;
    private readonly ILogger<CachedEventRepository> _logger;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public async Task<Event?> GetByIdAsync(Guid eventId, CancellationToken ct = default)
    {
        var cacheKey = $"event:{eventId}";

        // Try cache first
        var cached = await _cache.GetStringAsync(cacheKey, ct);
        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for event {EventId}", eventId);
            return JsonSerializer.Deserialize<Event>(cached);
        }

        // Cache miss: fetch from DB
        var eventEntity = await _inner.GetByIdAsync(eventId, ct);

        if (eventEntity is not null)
        {
            await _cache.SetStringAsync(
                cacheKey,
                JsonSerializer.Serialize(eventEntity),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = CacheDuration
                },
                ct);
        }

        return eventEntity;
    }

    // Invalidazione cache
    public async Task InvalidateCacheAsync(Guid eventId, CancellationToken ct = default)
    {
        await _cache.RemoveAsync($"event:{eventId}", ct);
        _logger.LogInformation("Cache invalidated for event {EventId}", eventId);
    }
}
```

### 11.4 Memory Management 🟡

```csharp
// ❌ MALE: Allocazioni eccessive in hot path
public string FormatTicketCode(Ticket ticket)
{
    return "TKT-" + ticket.EventId.ToString() + "-" + ticket.SeatNumber.ToString();
}

// ✅ BENE: String interpolation
public string FormatTicketCode(Ticket ticket)
{
    return $"TKT-{ticket.EventId}-{ticket.SeatNumber}";
}

// ✅ BENE: StringBuilder per concatenazioni multiple
public string BuildReport(IEnumerable<Order> orders)
{
    var sb = new StringBuilder();
    foreach (var order in orders)
    {
        sb.AppendLine($"Order {order.Id}: {order.Total:C}");
    }
    return sb.ToString();
}

// ✅ BENE: Span<T> per elaborazioni ad alta performance
public bool ValidateBarcode(ReadOnlySpan<char> barcode)
{
    if (barcode.Length != 13) return false;

    // Elaborazione senza allocazioni
    Span<int> digits = stackalloc int[13];
    for (int i = 0; i < 13; i++)
    {
        if (!char.IsDigit(barcode[i])) return false;
        digits[i] = barcode[i] - '0';
    }

    // Checksum validation...
    return true;
}
```

* * *

## 12\. Librerie Condivise e Riuso

### 12.1 Dove creare librerie condivise

Esempi di ambiti in cui ha senso creare librerie condivise:

- **Logging, Tracing e Observability (`TicketOne.Observability`)**  
    Scopo: standardizzare setup di Serilog, OpenTelemetry, CorrelationId, formati JSON, enrichment log.
    
- **HTTP Client & Resilienza (`TicketOne.Http`)**  
    Scopo: centralizzare politiche Polly (retry, circuit breaker, timeout, bulkhead) e convenzioni comuni per gli `HttpClient`.
    
- **Eventi di integrazione e messaging (`TicketOne.Messaging`)**  
    Scopo: definire contratti condivisi per eventi cross‑servizi (Kafka/RabbitMQ) e utilità per publish/consume.
    

E così via, rispettando i criteri descritti nel documento principale su librerie condivise (no logica di dominio specifica, dipendenze minime, riuso reale multi-progetto).

### 12.2 Extension Methods Condivisi 🟡

```csharp
// TicketOne.Common/Extensions/StringExtensions.cs
namespace TicketOne.Common.Extensions;

public static class StringExtensions
{
    public static bool IsNullOrWhiteSpace(this string? value)
        => string.IsNullOrWhiteSpace(value);

    public static string ToSnakeCase(this string value)
    {
        if (string.IsNullOrEmpty(value)) return value;

        return string.Concat(
                value.Select((c, i) => i > 0 && char.IsUpper(c) ? "_" + c : c.ToString()))
            .ToLowerInvariant();
    }
}

// TicketOne.Common/Extensions/EnumerableExtensions.cs
public static class EnumerableExtensions
{
    public static bool IsNullOrEmpty<T>(this IEnumerable<T>? source)
        => source is null || !source.Any();

    public static IEnumerable<IEnumerable<T>> Batch<T>(this IEnumerable<T> source, int batchSize)
    {
        var batch = new List<T>(batchSize);
        foreach (var item in source)
        {
            batch.Add(item);
            if (batch.Count >= batchSize)
            {
                yield return batch;
                batch = new List<T>(batchSize);
            }
        }
        if (batch.Count > 0) yield return batch;
    }
}
```

### 12.3 Guard Clauses Centralizzate 🟡

```csharp
// TicketOne.Common/Guards/Guard.cs
namespace TicketOne.Common.Guards;

public static class Guard
{
    public static T AgainstNull<T>(T? value, string paramName) where T : class
    {
        if (value is null)
            throw new ArgumentNullException(paramName);
        return value;
    }

    public static string AgainstNullOrEmpty(string? value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Value cannot be null or empty", paramName);
        return value;
    }

    public static Guid AgainstEmpty(Guid value, string paramName)
    {
        if (value == Guid.Empty)
            throw new ArgumentException("GUID cannot be empty", paramName);
        return value;
    }

    public static int AgainstNegative(int value, string paramName)
    {
        if (value < 0)
            throw new ArgumentOutOfRangeException(paramName, "Value cannot be negative");
        return value;
    }

    public static decimal AgainstNegative(decimal value, string paramName)
    {
        if (value < 0)
            throw new ArgumentOutOfRangeException(paramName, "Value cannot be negative");
        return value;
    }
}

// Utilizzo
public Order(Guid customerId, decimal total)
{
    CustomerId = Guard.AgainstEmpty(customerId, nameof(customerId));
    Total      = Guard.AgainstNegative(total, nameof(total));
}
```

* * *

## 13\. Observability: OpenTelemetry e Keep-Alive

- Tutti i nuovi servizi **DEVONO** essere OpenTelemetry‑ready (strumentazione base).
- Esporre un health endpoint `GET /health` (o `/healthz`) per readiness/liveness.
- Monitorare i 4 **Golden Signals** (latency, rate, error, saturation) con Prometheus/Grafana secondo le linee guida Eventim.

* * *

## 14\. Unit Testing e Testabilità

- Ogni nuova logica di dominio **deve essere pensata per gli unit test** ed avere test unitari dove sensato.
- Le nuove API critiche devono avere **integration test HTTP end‑to‑end**.
- Le classi devono essere progettate per essere facilmente mockabili (**DIP + DI**).

* * *

## 15\. Checklist PR / Commit (.NET TicketOne)

Questa checklist va usata **prima di chiudere un task JIRA** e prima di aprire una Pull Request o fare push su branch condivisi.

### 15.1 Verifica Funzionale di Base 🔴

- [ ] **I Criteri di Accettazione JIRA sono soddisfatti.**  
    \- La descrizione del ticket e gli acceptance criteria sono stati riletti e mappati uno a uno contro il comportamento implementato.
    
- [ ] **Ho testato manualmente lo scenario “Happy Path”.**  
    \- Almeno un flusso end‑to‑end reale (con dati realistici) eseguito sul branch di lavoro / ambiente dev.
    
- [ ] **Ho testato manualmente almeno un “Edge Case”.**  
    Esempi minimi:  
    \- \[ \] Input non valido (null/empty, formati errati, ID inesistenti).  
    \- \[ \] Errori da servizi esterni (timeout, HTTP 5xx, risposta non valida) con gestione corretta (retry / fallback / messaggio utente).  
    \- \[ \] Errori rete/transienti (disconnessione temporanea DB o HTTP).
    
- [ ] **Ho rispettato le regole di scrittura del codice del manuale di Coding”.**
    

## 16\. Riferimenti e Risorse

- EVENTIM Architecture & Development Guidelines
- EVENTIM Information Security Technological Policy
- OWASP Top 10
- OpenTelemetry .NET Docs
- Polly (resilienza): https://github.com/App-vNext/Polly
- MediatR: https://github.com/jbogard/MediatR

* * *