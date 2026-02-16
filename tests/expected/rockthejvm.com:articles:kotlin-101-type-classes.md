```json
{
  "title": "Kotlin 101: Type Classes Quickly Explained",
  "author": "Riccardo Cardin",
  "site": "Rock the JVM",
  "published": "2024-02-06T00:00:00.000Z"
}
```

In this article, we explore the concept of *type classes* in Kotlin, a powerful tool that allows developers to abstract logic for different data types. We'll take data validation as an example to show how type classes can be used to write generic and reusable code. Our implementation will be based on the [Arrow Kt](https://arrow-kt.io/) library, which will exploit Kotlin's context receivers. So, without further ado, let's get the party started.

> [!tip] Tip
> Type classes are tough. If you need to become proficient in Kotlin **quickly** and with thousands of lines of code and a project under your belt, you'll love [Kotlin Essentials](/courses/kotlin-essentials). It's a jam-packed course on **everything** you'll ever need to work with Kotlin for any platform.

## Setting the Stage

We'll use version 1.9.22 of Kotlin and version 1.2.1 of the Arrow library. We'll also use Kotlin's context receivers, which are still an experimental feature. We need to modify the Gradle configuration:

```kotlin
tasks.withType<KotlinCompile>().configureEach {
    kotlinOptions {
        freeCompilerArgs = freeCompilerArgs + "-Xcontext-receivers"
    }
}
```

## The Problem

In this article, we'll simulate a system for validating user portfolios in a fintech startup. Data validation is crucial in software development, especially in financial data transactions. Ensuring data conforms to expected formats and rules is vital for maintaining the system's integrity.

So, first, let's define the data we want to validate. The first DTO represents the creation of a new portfolio:

```kotlin
data class CreatePortfolioDTO(val userId: String, val amount: Double)
```

The above code could be more optimal and maintainable. We can abstract the validation process in a dedicated function using type classes, which is a common pattern in functional programming.