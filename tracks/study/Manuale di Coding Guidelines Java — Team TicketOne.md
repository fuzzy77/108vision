# Manuale di Coding Guidelines Java — Team TicketOne

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
    9.2 [Command / Mediator Pattern 🟡](#92-command--mediator-pattern-%F0%9F%9F%A1)  
    9.3 [CQRS 🟡](#93-cqrs-%F0%9F%9F%A1)  
    9.4 [Domain-Driven Design (DDD) 🟡](#94-domain-driven-design-ddd-%F0%9F%9F%A1)
10. [Pattern di Resilienza (Resilience4j)](#10-pattern-di-resilienza-resilience4j)  
    10.1 [Circuit Breaker 🔴](#101-circuit-breaker-%F0%9F%94%B4)  
    10.2 [Retry con Exponential Backoff 🔴](#102-retry-con-exponential-backoff-%F0%9F%94%B4)  
    10.3 [Bulkhead Pattern 🟡](#103-bulkhead-pattern-%F0%9F%9F%A1)  
    10.4 [Timeout Policy 🔴](#104-timeout-policy-%F0%9F%94%B4)  
    10.5 [Policy Combinate (Decorators) 🟡](#105-policy-combinate-decorators-%F0%9F%9F%A1)
11. [Performance e Ottimizzazione](#11-performance-e-ottimizzazione)  
    11.1 [Async/Non-Blocking Best Practices 🔴](#111-asyncnon-blocking-best-practices-%F0%9F%94%B4)  
    11.2 [Ottimizzazione Query JPA/Hibernate 🔴](#112-ottimizzazione-query-jpahibernate-%F0%9F%94%B4)  
    11.3 [Caching 🟡](#113-caching-%F0%9F%9F%A1)  
    11.4 [Memory Management 🟡](#114-memory-management-%F0%9F%9F%A1)
12. [Librerie Condivise e Riuso](#12-librerie-condivise-e-riuso)  
    12.1 [Dove creare librerie condivise](#121-dove-creare-librerie-condivise)  
    12.2 [Utility Classes e Default Methods 🟡](#122-utility-classes-e-default-methods-%F0%9F%9F%A1)  
    12.3 [Guard Clauses Centralizzate 🟡](#123-guard-clauses-centralizzate-%F0%9F%9F%A1)
13. [Observability: OpenTelemetry e Keep-Alive](#13-observability-opentelemetry-e-keep-alive)
14. [Unit Testing e Testabilità](#14-unit-testing-e-testabilit%C3%A0)
15. [Checklist PR / Commit (Java TicketOne)](#15-checklist-pr--commit-java-ticketone)
16. [Riferimenti e Risorse](#16-riferimenti-e-risorse)

* * *

## 1\. Introduzione e Obiettivi

Questo manuale definisce le **linee guida obbligatorie e raccomandate** per la scrittura di codice Java (principalmente stack Spring Boot) nel contesto della piattaforma TicketOne. L'obiettivo è garantire:

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

```java
// ❌ MALE: Cosa fa questo codice? Stream complessi e variabili non chiare
List<Dto> x = repo.findAll().stream()
    .filter(t -> t.getS() == 1 && t.getD().isBefore(LocalDateTime.now()))
    .map(t -> new Dto(t.getI(), t.getP()))
    .collect(Collectors.toList());

// ✅ BENE: Chiaro e auto-documentante
List<TicketSummaryDto> availableTickets = ticketRepository
    .findAll()
    .stream()
    .filter(ticket -> ticket.getStatus() == TicketStatus.AVAILABLE)
    .filter(ticket -> ticket.getEventDate().isBefore(LocalDateTime.now(ZoneOffset.UTC)))
    .map(ticket -> new TicketSummaryDto(ticket.getId(), ticket.getPrice()))
    .toList(); // Java 16+
```

### 2.2 Semplicità 🔴

> “La perfezione si raggiunge non quando non c'è più nulla da aggiungere, ma quando non c'è più nulla da togliere.” — Antoine de Saint-Exupéry

```java
// ❌ MALE: Complessità inutile (Arrow Anti-Pattern)
public boolean isValidTicket(Ticket ticket) {
    if (ticket != null) {
        if (ticket.getStatus() == TicketStatus.VALID) {
            if (ticket.getExpirationDate().isAfter(LocalDateTime.now())) {
                return true;
            }
        }
    }
    return false;
}

// ✅ BENE: Early return e guard clauses
public boolean isValidTicket(Ticket ticket) {
    if (ticket == null) return false;
    if (ticket.getStatus() != TicketStatus.VALID) return false;
    if (!ticket.getExpirationDate().isAfter(LocalDateTime.now())) return false;

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
| Package | lowercase, gerarchico | `it.ticketone.sales.orders` |
| Classe/Record/Enum | PascalCase, sostantivo | `OrderService` |
| Interfaccia | PascalCase (no prefisso I) | `OrderRepository` |
| Metodo | camelCase, verbo | `createOrder()` |
| Variabile/Campo | camelCase | `orderId` |
| Costante (static final) | UPPER_SNAKE_CASE | `MAX_TICKETS_PER_ORDER` |
| Generics | Lettera singola maiuscola | `T`, `E`, `R` |
| EndPoint/Api esposta | camelCase | createOperator |

*Nota: In Java standard, a differenza di .NET, non si usa il prefisso `I` per le interfacce (es. `OrderRepository` e non `IOrderRepository`), a meno che non ci siano vincoli legacy stretti.*

### 3.2 Naming Semantico 🔴

```java
// ❌ MALE: Nomi generici o criptici
var d = getData();
var temp = process(d);
var mgr = new Mgr();

// ✅ BENE: Nomi descrittivi che rivelano l'intento
var availableSeats = getAvailableSeatsForEvent(eventId);
var validatedOrder = validateOrderRules(order);
var ticketEmissionService = new TicketEmissionService();
```

* * *

## 4\. Principi OOP e Astrazione

### 4.1 Incapsulamento 🔴

```java
// ❌ MALE: Stato interno esposto, campi pubblici, liste mutabili
public class Order {
    public List<OrderItem> items = new ArrayList<>(); 
    public BigDecimal total;                 
}

// ✅ BENE: Stato protetto e comportamento esplicito
public class Order {
    private final List<OrderItem> items = new ArrayList<>();
    private BigDecimal total = BigDecimal.ZERO;

    public List<OrderItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void addItem(OrderItem item) {
        if (item == null)
            throw new IllegalArgumentException("Item cannot be null");

        if (items.size() >= MAX_ITEMS_PER_ORDER)
            throw new OrderLimitExceededException();

        items.add(item);
        recalculateTotal();
    }

    private void recalculateTotal() {
        total = items.stream()
            .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
```

### 4.2 Dipendere da Astrazioni (DIP) 🔴

```java
// ❌ MALE: Dipendenza da implementazione concreta
public class OrderService {
    private final SqlOrderRepository repository = new SqlOrderRepository();
}

// ✅ BENE: Dipendenza da astrazione (Dependency Injection via Spring)
@Service
public class OrderService {
    private final OrderRepository repository;

    // Constructor Injection (consigliata rispetto a @Autowired sui campi)
    public OrderService(OrderRepository repository) {
        this.repository = Objects.requireNonNull(repository);
    }
}
```

* * *

## 5\. Principi SOLID (Obbligatori)

I principi SOLID sono **OBBLIGATORI**. La **S (Single Responsibility)** è prioritaria.

### 5.1 Single Responsibility Principle (SRP) — IL PIÙ IMPORTANTE 🔴

> Una classe deve avere una e una sola ragione per cambiare.

```java
// ❌ MALE: Classe "God Object"
public class OrderManager {
    public Order createOrder(CreateOrderRequest request) { /* logica */ }
    public void validatePayment(Payment payment) { /* logica */ }
    public void sendConfirmationEmail(Order order) { /* logica */ }
    public String generatePdfTicket(Order order) { /* logica */ }
}

// ✅ BENE: Responsabilità separate
@Service
public class OrderCreationService {
    private final OrderRepository orderRepository;
    private final OrderValidator validator;

    public Result<Order> createOrder(CreateOrderCommand command) {
        var validationResult = validator.validate(command);
        if (!validationResult.isValid())
            return Result.failure(validationResult.getErrors());

        var order = Order.create(command);
        orderRepository.save(order);

        return Result.success(order);
    }
}

// Classi dedicate
public class PaymentValidationService { /* solo validazione pagamenti */ }
public class EmailNotificationService { /* solo invio email */ }
public class TicketPdfGenerator { /* solo generazione PDF */ }
```

### 5.2 Open/Closed Principle (OCP) 🟡

> Aperto all'estensione, chiuso alla modifica.

```java
// ❌ MALE: Switch case su tipi (richiede modifica per ogni nuovo tipo)
public class DiscountCalculator {
    public BigDecimal calculate(Order order, String discountType) {
        return switch (discountType) {
            case "percentage" -> order.getTotal().multiply(new BigDecimal("0.1"));
            case "fixed" -> BigDecimal.TEN;
            default -> BigDecimal.ZERO;
        };
    }
}

// ✅ BENE: Pattern Strategy
public interface DiscountStrategy {
    BigDecimal calculate(Order order);
}

public class PercentageDiscount implements DiscountStrategy {
    private final BigDecimal percentage;
    public PercentageDiscount(BigDecimal percentage) { this.percentage = percentage; }
    
    @Override
    public BigDecimal calculate(Order order) {
        return order.getTotal().multiply(percentage);
    }
}

public class DiscountCalculator {
    public BigDecimal calculate(Order order, DiscountStrategy strategy) {
        return strategy.calculate(order);
    }
}
```

### 5.3 Liskov Substitution Principle (LSP) 🟡

> I sottotipi devono essere sostituibili ai loro tipi base senza alterare la correttezza del programma.

Evitare di lanciare `UnsupportedOperationException` nelle sottoclassi se il metodo è definito nel padre. Se succede, la gerarchia è sbagliata.

### 5.4 Interface Segregation Principle (ISP) 🟡

> Nessun client dovrebbe dipendere da metodi che non usa.

Meglio tante interfacce piccole (`Refundable`, `Printable`) che una interfaccia gigante (`SuperOrderInterface`).

### 5.5 Dependency Inversion Principle (DIP) 🔴

> Dipendere dalle astrazioni, non dalle implementazioni concrete.

Usa sempre le interfacce per i repository e i servizi esterni quando li inietti in altri servizi.

* * *

## 6\. DRY, KISS, YAGNI e Pattern Comuni

### 6.1 DRY (Don't Repeat Yourself) 🔴

Non duplicare logica di business in più punti (es. regole di validazione biglietti sparse tra Controller e Service). Centralizzare nel Dominio.

### 6.2 KISS (Keep It Simple, Stupid) 🟡

Preferire la soluzione più semplice. Evitare over-engineering con generics complessi o Reflection se non strettamente necessario.

### 6.3 YAGNI (You Aren't Gonna Need It) 🟡

Non implementare funzionalità speculative.

### 6.4 Pattern Comuni 🟡

- **Repository**: usato via Spring Data JPA.
- **Builder**: utile per oggetti complessi, o usare `@Builder` di Lombok.
- **Factory**: per creazione di aggregati complessi.
- **Strategy**: per algoritmi intercambiabili (es. calcolo prezzi, selezione corriere).

* * *

## 7\. Clean Code e Tidy Code

### 7.1 Metodi Brevi con Singola Responsabilità 🔴

Se un metodo supera ~20–30 righe, probabilmente fa troppe cose. Estrai metodi privati con nomi significativi.

### 7.2 Guard Clauses (Early Return) 🔴

```java
// ❌ MALE: Nesting profondo (Arrow Code)
public Ticket getTicket(UUID ticketId, UUID userId) {
    if (ticketId != null) {
        var ticket = repo.findById(ticketId);
        if (ticket.isPresent()) {
            if (ticket.get().getOwnerId().equals(userId)) {
                return ticket.get();
            }
        }
    }
    throw new RuntimeException("Error");
}

// ✅ BENE: Guard clauses
public Ticket getTicket(UUID ticketId, UUID userId) {
    if (ticketId == null) throw new IllegalArgumentException("Invalid ticket ID");
    
    var ticket = repo.findById(ticketId)
        .orElseThrow(() -> new TicketNotFoundException(ticketId));

    if (!ticket.getOwnerId().equals(userId)) {
        throw new UnauthorizedAccessException("User does not own this ticket");
    }

    return ticket;
}
```

### 7.3 Evitare Magic Numbers/Strings 🔴

Usa costanti (`static final`) o Enum.

```java
// ✅ BENE
public static final int MAX_ITEMS_PER_ORDER = 10;
public static final String ROLE_ADMIN = "admin";
```

### 7.4 Commenti: Quando e Come 🟡

- **NO**: commenti che spiegano *cosa* fa il codice.
- **SÌ**: commenti che spiegano il *perché* (decisioni di design, workaround per bug di librerie terze).

* * *

## 8\. Gestione degli Errori, Logging Strutturato e Tracing

### 8.1 Logging Strutturato (JSON) 🔴

Usare **SLF4J** (interfaccia) e **Logback** (implementazione) configurati per output JSON (es. `LogstashLogbackEncoder`).

```java
// Utilizzo
@Slf4j // Lombok annotation per private static final Logger log
@Service
public class OrderService {

    public Result<Order> createOrder(CreateOrderCommand command) {
        log.info("Creating order for customer {} with {} items", 
                 command.customerId(), command.items().size());
        
        try {
             // logic...
             return Result.success(order);
        } catch (Exception ex) {
            log.error("Failed to create order for customer {}. Error: {}", 
                      command.customerId(), ex.getMessage(), ex);
            throw ex;
        }
    }
}
```

I log devono contenere MDC (Mapped Diagnostic Context) popolati automaticamente (trace_id, span_id).

### 8.2 OpenTelemetry e TraceId 🔴

Tutti i servizi devono usare l'agent Java di OpenTelemetry o le librerie Spring Boot Actuator + Micrometer Tracing.

- Non generare `traceId` manualmente.
- Includere `traceId` e `spanId` nei log (automatico se configurato correttamente logback-spring.xml).

### 8.3 Result Pattern 🟡

Invece di lanciare eccezioni per logica di business (es. "Credito insufficiente"), ritorna un oggetto `Result`.

```java
public record Result<T>(T value, boolean isSuccess, Error error) {
    public static <T> Result<T> success(T value) { return new Result<>(value, true, null); }
    public static <T> Result<T> failure(Error error) { return new Result<>(null, false, error); }
}

public record Error(String code, String message) {}
```

### 8.4 Gerarchia delle Eccezioni 🟡

Usare eccezioni (estendendo `RuntimeException`) solo per condizioni impreviste o errori di sistema, non per il flusso di controllo normale.

* * *

## 9\. Pattern Architetturali

### 9.1 Result Pattern

Vedi [8.3](#83-result-pattern-%F0%9F%9F%A1).

### 9.2 Command / Mediator Pattern 🟡

Anche se meno "nativo" che in .NET, è buona norma disaccoppiare i Controller dalla Business Logic usando comandi.

```java
// Command record
public record CreateOrderCommand(UUID customerId, List<OrderItemDto> items) {}

// Handler interface
public interface CommandHandler<C, R> {
    R handle(C command);
}

// Implementation
@Service
public class CreateOrderHandler implements CommandHandler<CreateOrderCommand, Result<OrderDto>> {
    // ... logic
}
```

### 9.3 CQRS 🟡

Separare i modelli di lettura (es. DTO proiettati direttamente via SQL/JPA Projections) dai modelli di scrittura (Entities con logica di dominio).

### 9.4 Domain-Driven Design (DDD) 🟡

Applicare DDD nei bounded context core. Usare Aggregati, Value Objects (perfetti come `record` Java), ed Eventi di Dominio (`ApplicationEventPublisher`).

* * *

## 10\. Pattern di Resilienza (Resilience4j)

Usare **Resilience4j** (standard Java equivalente a Polly). Evitare chiamate HTTP "nude" verso sistemi esterni.

### 10.1 Circuit Breaker 🔴

```java
@CircuitBreaker(name = "paymentService", fallbackMethod = "fallbackPayment")
public PaymentResponse processPayment(PaymentRequest request) {
    return paymentClient.pay(request);
}

public PaymentResponse fallbackPayment(PaymentRequest request, CallNotPermittedException e) {
    log.warn("Circuit breaker open for payment service");
    return PaymentResponse.pending();
}
```

### 10.2 Retry con Exponential Backoff 🔴

Configurazione YAML (Spring Boot):

```yaml
resilience4j:
  retry:
    instances:
      siaeService:
        maxAttempts: 3
        waitDuration: 1s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
```

### 10.3 Bulkhead Pattern 🟡

Per limitare il numero di richieste concorrenti verso un servizio esterno.

### 10.4 Timeout Policy 🔴

Impostare sempre `connectTimeout` e `readTimeout` sui client HTTP (es. `WebClient` o `RestTemplate`).

### 10.5 Policy Combinate (Decorators) 🟡

Resilience4j permette di decorare funzioni con più policy (Retry avvolge CircuitBreaker che avvolge RateLimiter).

* * *

## 11\. Performance e Ottimizzazione

### 11.1 Async/Non-Blocking Best Practices 🔴

```java
// ❌ MALE: Blocking call (.get() o .join()) su CompletableFuture
public Order getOrder(UUID id) {
    return asyncService.getOrder(id).join(); // BLOCKING! Risk of Thread starvation
}

// ✅ BENE: Composizione asincrona (CompletableFuture)
public CompletableFuture<OrderSummary> getSummary(UUID orderId) {
    var orderFuture = repo.findByIdAsync(orderId);
    var customerFuture = customerService.getCustomerAsync(orderId);
    
    return CompletableFuture.allOf(orderFuture, customerFuture)
        .thenApply(v -> new OrderSummary(orderFuture.join(), customerFuture.join()));
}

// ✅ ALTERNATIVA: Virtual Threads (Java 21+)
// Con Java 21, il codice imperativo bloccante è performante se gira su Virtual Threads.
```

### 11.2 Ottimizzazione Query JPA/Hibernate 🔴

```java
// ❌ MALE: N+1 Query Problem
List<Order> orders = orderRepo.findAll();
// Se accediamo a order.getItems() in un loop, Hibernate farà una query per ogni ordine.

// ✅ BENE: EntityGraph o JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
Optional<Order> findByIdWithItems(@Param("id") UUID id);

// ✅ BENE: DTO Projections (Read-Only)
@Query("SELECT new com.ticketone.dto.OrderSummary(o.id, o.total) FROM Order o")
List<OrderSummary> findAllSummaries();
```

### 11.3 Caching 🟡

Usare `@Cacheable` di Spring con Redis.

```java
@Cacheable(value = "events", key = "#eventId", unless = "#result == null")
public EventDto getEvent(UUID eventId) {
    return repository.findById(eventId).map(mapper::toDto).orElse(null);
}
```

### 11.4 Memory Management 🟡

- Usare `StringBuilder` per concatenazioni in loop.
- Preferire `Stream` per elaborazioni pipeline ma attenzione all'overhead su liste piccolissime.
- Usare `record` (immutabili) per i DTO per ridurre errori di stato e boilerplate.

* * *

## 12\. Librerie Condivise e Riuso

### 12.1 Dove creare librerie condivise

Come per .NET: librerie per Logging standard, configurazione Security base, Client HTTP con policy Resilience4j preconfigurate.

### 12.2 Utility Classes e Default Methods 🟡

In Java non esistono Extension Methods "puri" (come C#). Usare metodi statici in classi `Utils` o metodi di default nelle interfacce.

```java
// TicketOneUtils.java
public static String toSnakeCase(String input) { ... }

// Uso
String s = TicketOneUtils.toSnakeCase(myString);
```

### 12.3 Guard Clauses Centralizzate 🟡

```java
public final class Guard {
    private Guard() {}
    
    public static <T> T againstNull(T value, String name) {
        if (value == null) throw new IllegalArgumentException(name + " cannot be null");
        return value;
    }
    
    public static UUID againstEmpty(UUID value, String name) {
        // ...
    }
}
```

* * *

## 13\. Observability: OpenTelemetry e Keep-Alive

- Abilitare **Spring Boot Actuator**: endpoint `/actuator/health` e `/actuator/prometheus`.
- Configurare OpenTelemetry Agent all'avvio della JVM (`-javaagent:opentelemetry-javaagent.jar`).

* * *

## 14\. Unit Testing e Testabilità

- **JUnit 5** come framework di test.
- **Mockito** per i mock.
- **AssertJ** per asserzioni fluenti (`assertThat(result).isEqualTo(expected)`).
- **Testcontainers** per Integration Test reali (Docker con DB vero, non H2 in-memory).

* * *

## 15\. Checklist PR / Commit (Java TicketOne)

Questa checklist va usata **prima di chiudere un task JIRA**.

### 15.1 Verifica Funzionale di Base 🔴

- [ ] **I Criteri di Accettazione JIRA sono soddisfatti.**
- [ ] **Ho testato manualmente lo scenario “Happy Path”.**
- [ ] **Ho testato manualmente almeno un “Edge Case”** (Input nulli, eccezioni gestite).
- [ ] **Il codice compila senza warning deprecati.**
- [ ] **Ho rispettato le convenzioni di naming Java.**
- [ ] **Non ci sono `System.out.println` (usare SLF4J).**
- [ ] **La gestione delle transazioni (`@Transactional`) è corretta.**

* * *

## 16\. Riferimenti e Risorse

- EVENTIM Architecture & Development Guidelines
- OWASP Top 10
- Spring Boot Documentation
- Resilience4j Documentation
- OpenTelemetry Java
- "Effective Java" by Joshua Bloch

* * *