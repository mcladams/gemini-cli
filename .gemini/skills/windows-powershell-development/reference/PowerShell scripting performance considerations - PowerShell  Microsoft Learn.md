PowerShell scripts that leverage .NET directly and avoid the pipeline tend to be faster than idiomatic PowerShell. Idiomatic PowerShell uses cmdlets and PowerShell functions, often leveraging the pipeline, and resorting to .NET only when necessary.

Note

Many of the techniques described here aren't idiomatic PowerShell and may reduce the readability of a PowerShell script. Script authors are advised to use idiomatic PowerShell unless performance dictates otherwise.

## Suppressing output

There are many ways to avoid writing objects to the pipeline.

-   Assignment or file redirection to `$null`
-   Casting to `[void]`
-   Pipe to `Out-Null`

The speeds of assigning to `$null`, casting to `[void]`, and file redirection to `$null` are almost identical. However, calling `Out-Null` in a large loop can be significantly slower, especially in PowerShell 5.1.

```
<span><span>$tests</span> = @{
    <span>'Assign to $null'</span> = {
        <span>$arrayList</span> = [System.Collections.ArrayList]::new()
        <span>foreach</span> (<span>$i</span> <span>in</span> <span>0</span>..<span>$args</span>[<span>0</span>]) {
            <span>$null</span> = <span>$arraylist</span>.Add(<span>$i</span>)
        }
    }
    <span>'Cast to [void]'</span> = {
        <span>$arrayList</span> = [System.Collections.ArrayList]::new()
        <span>foreach</span> (<span>$i</span> <span>in</span> <span>0</span>..<span>$args</span>[<span>0</span>]) {
            [void] <span>$arraylist</span>.Add(<span>$i</span>)
        }
    }
    <span>'Redirect to $null'</span> = {
        <span>$arrayList</span> = [System.Collections.ArrayList]::new()
        <span>foreach</span> (<span>$i</span> <span>in</span> <span>0</span>..<span>$args</span>[<span>0</span>]) {
            <span>$arraylist</span>.Add(<span>$i</span>) &gt; <span>$null</span>
        }
    }
    <span>'Pipe to Out-Null'</span> = {
        <span>$arrayList</span> = [System.Collections.ArrayList]::new()
        <span>foreach</span> (<span>$i</span> <span>in</span> <span>0</span>..<span>$args</span>[<span>0</span>]) {
            <span>$arraylist</span>.Add(<span>$i</span>) | <span>Out-Null</span>
        }
    }
}

<span>10</span>kb, <span>50</span>kb, <span>100</span>kb | <span>ForEach-Object</span> {
    <span>$groupResult</span> = <span>foreach</span> (<span>$test</span> <span>in</span> <span>$tests</span>.GetEnumerator()) {
        <span>$ms</span> = (<span>Measure-Command</span> { &amp; <span>$test</span>.Value <span>$_</span> }).TotalMilliseconds

        [pscustomobject]@{
            Iterations        = <span>$_</span>
            Test              = <span>$test</span>.Key
            TotalMilliseconds = [Math]::Round(<span>$ms</span>, <span>2</span>)
        }

        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }

    <span>$groupResult</span> = <span>$groupResult</span> | <span>Sort-Object</span> TotalMilliseconds
    <span>$groupResult</span> | <span>Select-Object</span> *, @{
        Name       = <span>'RelativeSpeed'</span>
        Expression = {
            <span>$relativeSpeed</span> = <span>$_</span>.TotalMilliseconds / <span>$groupResult</span>[<span>0</span>].TotalMilliseconds
            [Math]::Round(<span>$relativeSpeed</span>, <span>2</span>).ToString() + <span>'x'</span>
        }
    }
}
</span>
```

These tests were run on a Windows 11 machine in PowerShell 7.3.4. The results are shown below:

```
Iterations Test              TotalMilliseconds RelativeSpeed
---------- ----              ----------------- -------------
     10240 Assign to $null               36.74 1x
     10240 Redirect to $null             55.84 1.52x
     10240 Cast to [void]                62.96 1.71x
     10240 Pipe to Out-Null              81.65 2.22x
     51200 Assign to $null              193.92 1x
     51200 Cast to [void]               200.77 1.04x
     51200 Redirect to $null            219.69 1.13x
     51200 Pipe to Out-Null             329.62 1.7x
    102400 Redirect to $null            386.08 1x
    102400 Assign to $null              392.13 1.02x
    102400 Cast to [void]               405.24 1.05x
    102400 Pipe to Out-Null             572.94 1.48x
```

The times and relative speeds can vary depending on the hardware, the version of PowerShell, and the current workload on the system.

## Array addition

Generating a list of items is often done using an array with the addition operator:

```
<span><span>$results</span> = @()
<span>$results</span> += <span>Get-Something</span>
<span>$results</span> += <span>Get-SomethingElse</span>
<span>$results</span>
</span>
```

Note

In PowerShell 7.5, array addition was optimized and no longer creates a new array for each operation. The performance considerations described here still apply to PowerShell versions prior to 7.5. For more information, see [What's New in PowerShell 7.5](https://learn.microsoft.com/en-us/powershell/scripting/whats-new/what-s-new-in-powershell-75?view=powershell-7.6#engine-improvements).

Array addition is inefficient because arrays have a fixed size. Each addition to the array creates a new array big enough to hold all elements of both the left and right operands. The elements of both operands are copied into the new array. For small collections, this overhead may not matter. Performance can suffer for large collections.

There are a couple of alternatives. If you don't actually require an array, instead consider using a typed generic list (`[List<T>]`):

```
<span><span>$results</span> = [System.Collections.Generic.List[Object]]::new()
<span>$results</span>.AddRange((<span>Get-Something</span>))
<span>$results</span>.AddRange((<span>Get-SomethingElse</span>))
<span>$results</span>
</span>
```

The performance impact of using array addition grows exponentially with the size of the collection and the number additions. This code compares explicitly assigning values to an array with using array addition and using the `Add(T)` method on a `[List<T>]` object. It defines explicit assignment as the baseline for performance.

```
<span><span>$tests</span> = @{
    <span>'PowerShell Explicit Assignment'</span> = {
        <span>param</span>(<span>$Count</span>)

        <span>$result</span> = <span>foreach</span>(<span>$i</span> <span>in</span> <span>1</span>..<span>$Count</span>) {
            <span>$i</span>
        }
    }
    <span>'.Add(T) to List&lt;T&gt;'</span> = {
        <span>param</span>(<span>$Count</span>)

        <span>$result</span> = [Collections.Generic.List[int]]::new()
        <span>foreach</span>(<span>$i</span> <span>in</span> <span>1</span>..<span>$Count</span>) {
            <span>$result</span>.Add(<span>$i</span>)
        }
    }
    <span>'+= Operator to Array'</span> = {
        <span>param</span>(<span>$Count</span>)

        <span>$result</span> = @()
        <span>foreach</span>(<span>$i</span> <span>in</span> <span>1</span>..<span>$Count</span>) {
            <span>$result</span> += <span>$i</span>
        }
    }
}

<span>5</span>kb, <span>10</span>kb, <span>100</span>kb | <span>ForEach-Object</span> {
    <span>$groupResult</span> = <span>foreach</span>(<span>$test</span> <span>in</span> <span>$tests</span>.GetEnumerator()) {
        <span>$ms</span> = (<span>Measure-Command</span> { &amp; <span>$test</span>.Value<span> -Count</span> <span>$_</span> }).TotalMilliseconds

        [pscustomobject]@{
            CollectionSize    = <span>$_</span>
            Test              = <span>$test</span>.Key
            TotalMilliseconds = [Math]::Round(<span>$ms</span>, <span>2</span>)
        }

        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }

    <span>$groupResult</span> = <span>$groupResult</span> | <span>Sort-Object</span> TotalMilliseconds
    <span>$groupResult</span> | <span>Select-Object</span> *, @{
        Name       = <span>'RelativeSpeed'</span>
        Expression = {
            <span>$relativeSpeed</span> = <span>$_</span>.TotalMilliseconds / <span>$groupResult</span>[<span>0</span>].TotalMilliseconds
            [Math]::Round(<span>$relativeSpeed</span>, <span>2</span>).ToString() + <span>'x'</span>
        }
    }
}
</span>
```

These tests were run on a Windows 11 machine in PowerShell 7.3.4.

```
CollectionSize Test                           TotalMilliseconds RelativeSpeed
-------------- ----                           ----------------- -------------
          5120 PowerShell Explicit Assignment             26.65 1x
          5120 .Add(T) to List&lt;T&gt;                        110.98 4.16x
          5120 += Operator to Array                      402.91 15.12x
         10240 PowerShell Explicit Assignment              0.49 1x
         10240 .Add(T) to List&lt;T&gt;                        137.67 280.96x
         10240 += Operator to Array                     1678.13 3424.76x
        102400 PowerShell Explicit Assignment             11.18 1x
        102400 .Add(T) to List&lt;T&gt;                       1384.03 123.8x
        102400 += Operator to Array                   201991.06 18067.18x
```

When you're working with large collections, array addition is dramatically slower than adding to a **`List<T>`**.

When using a `[List<T>]` object, you need to create the list with a specific type, like `[string]` or `[int]`. When you add objects of a different type to the list, they are cast to the specified type. If they can't be cast to the specified type, the method raises an exception.

```
<span><span>$intList</span> = [System.Collections.Generic.List[int]]::new()
<span>$intList</span>.Add(<span>1</span>)
<span>$intList</span>.Add(<span>'2'</span>)
<span>$intList</span>.Add(<span>3.0</span>)
<span>$intList</span>.Add(<span>'Four'</span>)
<span>$intList</span>
</span>
```

```
MethodException:
Line |
   5 |  $intList.Add('Four')
     |  ~~~~~~~~~~~~~~~~~~~~
     | Cannot convert argument "item", with value: "Four", for "Add" to type
     "System.Int32": "Cannot convert value "Four" to type "System.Int32".
     Error: "The input string 'Four' was not in a correct format.""

1
2
3
```

When you need the list to be a collection of different types of objects, create it with `[Object]` as the list type. You can enumerate the collection inspect the types of the objects in it.

```
<span><span>$objectList</span> = [System.Collections.Generic.List[Object]]::new()
<span>$objectList</span>.Add(<span>1</span>)
<span>$objectList</span>.Add(<span>'2'</span>)
<span>$objectList</span>.Add(<span>3.0</span>)
<span>$objectList</span> | <span>ForEach-Object</span> { <span>"<span>$_</span> is $(<span>$_</span>.GetType())"</span> }
</span>
```

```
1 is int
2 is string
3 is double
```

If you do require an array, you can call the `ToArray()` method on the list or you can let PowerShell create the array for you:

```
<span><span>$results</span> = @(
    <span>Get-Something</span>
    <span>Get-SomethingElse</span>
)
</span>
```

In this example, PowerShell creates an `[ArrayList]` to hold the results written to the pipeline inside the array expression. Just before assigning to `$results`, PowerShell converts the `[ArrayList]` to an `[Object[]]`.

### Type-safe collections

PowerShell is a loosely typed language, which makes coding easier but can have performance implications. Consider using type-safe (or type-specific) collections. Type-safe collections consume less memory and are faster. Compare the following examples:

```
<span><span>$Stopwatch</span> = [System.Diagnostics.Stopwatch]::StartNew()
<span>$ListInt</span> = [System.Collections.Generic.List[int]]::new()
<span>for</span> (<span>$i</span> = <span>0</span>; <span>$i</span><span> -lt</span> <span>1</span>mb; <span>$i</span>++) {
    <span>$ListInt</span>.Add(<span>$i</span>)
}
<span>$Stopwatch</span>.Stop()
<span>Write-Host</span> <span>"Time to add 1mb integers to List[int]: $(<span>$Stopwatch</span>.Elapsed.TotalSeconds) seconds."</span>
</span>
```

```
Time to add 1mb integers to List[int]: 9.8841501 seconds.
```

Creating a list of `[int]` is faster than creating a list of `[Object]`.

```
<span><span>$Stopwatch</span> = [System.Diagnostics.Stopwatch]::StartNew()
<span>$ListObject</span> = [System.Collections.Generic.List[Object]]::new()
<span>for</span> (<span>$i</span> = <span>0</span>; <span>$i</span><span> -lt</span> <span>1</span>mb; <span>$i</span>++) {
    <span>$ListObject</span>.Add(<span>$i</span>)
}
<span>$Stopwatch</span>.Stop()
<span>Write-Host</span> <span>"Time to add 1mb integers to List[Object]: $(<span>$Stopwatch</span>.Elapsed.TotalSeconds) seconds."</span>
</span>
```

```
Time to add 1mb integers to List[Object]: 10.5677782 seconds.
```

## String addition

Strings are immutable. Each addition to the string actually creates a new string big enough to hold the contents of both the left and right operands, then copies the elements of both operands into the new string. For small strings, this overhead may not matter. For large strings, this can affect performance and memory consumption.

There are at least two alternatives:

-   The [`-join` operator](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_join) concatenates strings
-   The .NET `[StringBuilder]` class provides a mutable string

The following example compares the performance of these three methods of building a string.

```
<span><span>$tests</span> = @{
    <span>'StringBuilder'</span> = {
        <span>$sb</span> = [System.Text.StringBuilder]::new()
        <span>foreach</span> (<span>$i</span> <span>in</span> <span>0</span>..<span>$args</span>[<span>0</span>]) {
            <span>$sb</span> = <span>$sb</span>.AppendLine(<span>"Iteration <span>$i</span>"</span>)
        }
        <span>$sb</span>.ToString()
    }
    <span>'Join operator'</span> = {
        <span>$string</span> = @(
            <span>foreach</span> (<span>$i</span> <span>in</span> <span>0</span>..<span>$args</span>[<span>0</span>]) {
                <span>"Iteration <span>$i</span>"</span>
            }
        )<span> -join</span> <span>"`n"</span>
        <span>$string</span>
    }
    <span>'Addition Assignment +='</span> = {
        <span>$string</span> = <span>''</span>
        <span>foreach</span> (<span>$i</span> <span>in</span> <span>0</span>..<span>$args</span>[<span>0</span>]) {
            <span>$string</span> += <span>"Iteration <span>$i</span>`n"</span>
        }
        <span>$string</span>
    }
}

<span>10</span>kb, <span>50</span>kb, <span>100</span>kb | <span>ForEach-Object</span> {
    <span>$groupResult</span> = <span>foreach</span> (<span>$test</span> <span>in</span> <span>$tests</span>.GetEnumerator()) {
        <span>$ms</span> = (<span>Measure-Command</span> { &amp; <span>$test</span>.Value <span>$_</span> }).TotalMilliseconds

        [pscustomobject]@{
            Iterations        = <span>$_</span>
            Test              = <span>$test</span>.Key
            TotalMilliseconds = [Math]::Round(<span>$ms</span>, <span>2</span>)
        }

        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }

    <span>$groupResult</span> = <span>$groupResult</span> | <span>Sort-Object</span> TotalMilliseconds
    <span>$groupResult</span> | <span>Select-Object</span> *, @{
        Name       = <span>'RelativeSpeed'</span>
        Expression = {
            <span>$relativeSpeed</span> = <span>$_</span>.TotalMilliseconds / <span>$groupResult</span>[<span>0</span>].TotalMilliseconds
            [Math]::Round(<span>$relativeSpeed</span>, <span>2</span>).ToString() + <span>'x'</span>
        }
    }
}
</span>
```

These tests were run on a Windows 11 machine in PowerShell 7.4.2. The output shows that the `-join` operator is the fastest, followed by the `[StringBuilder]` class.

```
Iterations Test                   TotalMilliseconds RelativeSpeed
---------- ----                   ----------------- -------------
     10240 Join operator                      14.75 1x
     10240 StringBuilder                      62.44 4.23x
     10240 Addition Assignment +=            619.64 42.01x
     51200 Join operator                      43.15 1x
     51200 StringBuilder                     304.32 7.05x
     51200 Addition Assignment +=          14225.13 329.67x
    102400 Join operator                      85.62 1x
    102400 StringBuilder                     499.12 5.83x
    102400 Addition Assignment +=          67640.79 790.01x
```

The times and relative speeds can vary depending on the hardware, the version of PowerShell, and the current workload on the system.

## Processing large files

The idiomatic way to process a file in PowerShell might look something like:

```
<span><span>Get-Content</span> <span>$path</span> | <span>Where-Object</span> Length<span> -GT</span> <span>10</span>
</span>
```

This can be an order of magnitude slower than using .NET APIs directly. For example, you can use the .NET `[StreamReader]` class:

```
<span><span>try</span> {
    <span>$reader</span> = [System.IO.StreamReader]::new(<span>$path</span>)
    <span>while</span> (<span>-not</span> <span>$reader</span>.EndOfStream) {
        <span>$line</span> = <span>$reader</span>.ReadLine()
        <span>if</span> (<span>$line</span>.Length<span> -gt</span> <span>10</span>) {
            <span>$line</span>
        }
    }
}
<span>finally</span> {
    <span>if</span> (<span>$reader</span>) {
        <span>$reader</span>.Dispose()
    }
}
</span>
```

You could also use the `ReadLines` method of `[System.IO.File]`, which wraps `StreamReader`, simplifies the reading process:

```
<span><span>foreach</span> (<span>$line</span> <span>in</span> [System.IO.File]::ReadLines(<span>$path</span>)) {
    <span>if</span> (<span>$line</span>.Length<span> -gt</span> <span>10</span>) {
        <span>$line</span>
    }
}
</span>
```

### Looking up entries by property in large collections

It's common to need to use a shared property to identify the same record in different collections, like using a name to retrieve an ID from one list and an email from another. Iterating over the first list to find the matching record in the second collection is slow. In particular, the repeated filtering of the second collection has a large overhead.

Given two collections, one with an **Id** and **Name**, the other with **Name** and **Email**:

```
<span><span>$Employees</span> = <span>1</span>..<span>10000</span> | <span>ForEach-Object</span> {
    [pscustomobject]@{
        Id   = <span>$_</span>
        Name = <span>"Name<span>$_</span>"</span>
    }
}

<span>$Accounts</span> = <span>2500</span>..<span>7500</span> | <span>ForEach-Object</span> {
    [pscustomobject]@{
        Name  = <span>"Name<span>$_</span>"</span>
        Email = <span>"Name<span>$_</span>@fabrikam.com"</span>
    }
}
</span>
```

The usual way to reconcile these collections to return a list of objects with the **Id**, **Name**, and **Email** properties might look like this:

```
<span><span>$Results</span> = <span>$Employees</span> | <span>ForEach-Object</span><span> -Process</span> {
    <span>$Employee</span> = <span>$_</span>

    <span>$Account</span> = <span>$Accounts</span> | <span>Where-Object</span><span> -FilterScript</span> {
        <span>$_</span>.Name<span> -eq</span> <span>$Employee</span>.Name
    }

    [pscustomobject]@{
        Id    = <span>$Employee</span>.Id
        Name  = <span>$Employee</span>.Name
        Email = <span>$Account</span>.Email
    }
}
</span>
```

However, that implementation has to filter all 5000 items in the `$Accounts` collection once for every item in the `$Employee` collection. That can take minutes, even for this single-value lookup.

Instead, you can make a [Hash Table](https://learn.microsoft.com/en-us/powershell/scripting/learn/deep-dives/everything-about-hashtable?view=powershell-7.6) that uses the shared **Name** property as a key and the matching account as the value.

```
<span><span>$LookupHash</span> = @{}
<span>foreach</span> (<span>$Account</span> <span>in</span> <span>$Accounts</span>) {
    <span>$LookupHash</span>[<span>$Account</span>.Name] = <span>$Account</span>
}
</span>
```

Looking up keys in a hash table is much faster than filtering a collection by property values. Instead of checking every item in the collection, PowerShell can check if the key is defined and use its value.

```
<span><span>$Results</span> = <span>$Employees</span> | <span>ForEach-Object</span><span> -Process</span> {
    <span>$Email</span> = <span>$LookupHash</span>[<span>$_</span>.Name].Email
    [pscustomobject]@{
        Id    = <span>$_</span>.Id
        Name  = <span>$_</span>.Name
        Email = <span>$Email</span>
    }
}
</span>
```

This is much faster. While the looping filter took minutes to complete, the hash lookup takes less than a second.

## Use Write-Host carefully

The `Write-Host` command should only be used when you need to write formatted text to the host console, rather than writing objects to the **Success** pipeline.

`Write-Host` can be an order of magnitude slower than `[Console]::WriteLine()` for specific hosts like `pwsh.exe`, `powershell.exe`, or `powershell_ise.exe`. However, `[Console]::WriteLine()` isn't guaranteed to work in all hosts. Also, output written using `[Console]::WriteLine()` doesn't get written to transcripts started by `Start-Transcript`.

### JIT compilation

PowerShell compiles the script code to bytecode that's interpreted. Beginning in PowerShell 3, for code that's repeatedly executed in a loop, PowerShell can improve performance by Just-in-time (JIT) compiling the code into native code.

Loops that have fewer than 300 instructions are eligible for JIT-compilation. Loops larger than that are too costly to compile. When the loop has executed 16 times, the script is JIT-compiled in the background. When the JIT-compilation completes, execution is transferred to the compiled code.

## Avoid repeated calls to a function

Calling a function can be an expensive operation. If you're calling a function in a long running tight loop, consider moving the loop inside the function.

Consider the following examples:

```
<span><span>$tests</span> = @{
    <span>'Simple for-loop'</span>       = {
        <span>param</span>([int] <span>$RepeatCount</span>, [random] <span>$RanGen</span>)

        <span>for</span> (<span>$i</span> = <span>0</span>; <span>$i</span><span> -lt</span> <span>$RepeatCount</span>; <span>$i</span>++) {
            <span>$null</span> = <span>$RanGen</span>.Next()
        }
    }
    <span>'Wrapped in a function'</span> = {
        <span>param</span>([int] <span>$RepeatCount</span>, [random] <span>$RanGen</span>)

        <span>function</span> <span>Get-RandomNumberCore</span> {
            <span>param</span> (<span>$Rng</span>)

            <span>$Rng</span>.Next()
        }

        <span>for</span> (<span>$i</span> = <span>0</span>; <span>$i</span><span> -lt</span> <span>$RepeatCount</span>; <span>$i</span>++) {
            <span>$null</span> = <span>Get-RandomNumberCore</span><span> -Rng</span> <span>$RanGen</span>
        }
    }
    <span>'for-loop in a function'</span> = {
        <span>param</span>([int] <span>$RepeatCount</span>, [random] <span>$RanGen</span>)

        <span>function</span> <span>Get-RandomNumberAll</span> {
            <span>param</span> (<span>$Rng</span>, <span>$Count</span>)

            <span>for</span> (<span>$i</span> = <span>0</span>; <span>$i</span><span> -lt</span> <span>$Count</span>; <span>$i</span>++) {
                <span>$null</span> = <span>$Rng</span>.Next()
            }
        }

        <span>Get-RandomNumberAll</span><span> -Rng</span> <span>$RanGen</span><span> -Count</span> <span>$RepeatCount</span>
    }
}

<span>5</span>kb, <span>10</span>kb, <span>100</span>kb | <span>ForEach-Object</span> {
    <span>$Rng</span> = [random]::new()
    <span>$groupResult</span> = <span>foreach</span> (<span>$test</span> <span>in</span> <span>$tests</span>.GetEnumerator()) {
        <span>$ms</span> = <span>Measure-Command</span> { &amp; <span>$test</span>.Value<span> -RepeatCount</span> <span>$_</span><span> -RanGen</span> <span>$Rng</span> }

        [pscustomobject]@{
            CollectionSize    = <span>$_</span>
            Test              = <span>$test</span>.Key
            TotalMilliseconds = [Math]::Round(<span>$ms</span>.TotalMilliseconds,<span>2</span>)
        }

        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }

    <span>$groupResult</span> = <span>$groupResult</span> | <span>Sort-Object</span> TotalMilliseconds
    <span>$groupResult</span> | <span>Select-Object</span> *, @{
        Name       = <span>'RelativeSpeed'</span>
        Expression = {
            <span>$relativeSpeed</span> = <span>$_</span>.TotalMilliseconds / <span>$groupResult</span>[<span>0</span>].TotalMilliseconds
            [Math]::Round(<span>$relativeSpeed</span>, <span>2</span>).ToString() + <span>'x'</span>
        }
    }
}
</span>
```

The **Basic for-loop** example is the base line for performance. The second example wraps the random number generator in a function that's called in a tight loop. The third example moves the loop inside the function. The function is only called once but the code still generates the same amount of random numbers. Notice the difference in execution times for each example.

```
CollectionSize Test                   TotalMilliseconds RelativeSpeed
-------------- ----                   ----------------- -------------
          5120 for-loop in a function              9.62 1x
          5120 Simple for-loop                    10.55 1.1x
          5120 Wrapped in a function              62.39 6.49x
         10240 Simple for-loop                    17.79 1x
         10240 for-loop in a function             18.48 1.04x
         10240 Wrapped in a function             127.39 7.16x
        102400 for-loop in a function            179.19 1x
        102400 Simple for-loop                   181.58 1.01x
        102400 Wrapped in a function            1155.57 6.45x
```

## Avoid wrapping cmdlet pipelines

Most cmdlets are implemented for the pipeline, which is a sequential syntax and process. For example:

```
<span>cmdlet1 | cmdlet2 | cmdlet3
</span>
```

Initializing a new pipeline can be expensive, therefore you should avoid wrapping a cmdlet pipeline into another existing pipeline.

Consider the following example. The `Input.csv` file contains 2100 lines. The `Export-Csv` command is wrapped inside the `ForEach-Object` pipeline. The `Export-Csv` cmdlet is invoked for every iteration of the `ForEach-Object` loop.

```
<span><span>$measure</span> = <span>Measure-Command</span><span> -Expression</span> {
    <span>Import-Csv</span> .\Input.csv | <span>ForEach-Object</span><span> -Begin</span> { <span>$Id</span> = <span>1</span> }<span> -Process</span> {
        [pscustomobject]@{
            Id   = <span>$Id</span>
            Name = <span>$_</span>.opened_by
        } | <span>Export-Csv</span> .\Output1.csv<span> -Append</span>
    }
}

<span>'Wrapped = {0:N2} ms'</span><span> -f</span> <span>$measure</span>.TotalMilliseconds
</span>
```

```
Wrapped = 15,968.78 ms
```

For the next example, the `Export-Csv` command was moved outside of the `ForEach-Object` pipeline. In this case, `Export-Csv` is invoked only once, but still processes all objects passed out of `ForEach-Object`.

```
<span><span>$measure</span> = <span>Measure-Command</span><span> -Expression</span> {
    <span>Import-Csv</span> .\Input.csv | <span>ForEach-Object</span><span> -Begin</span> { <span>$Id</span> = <span>2</span> }<span> -Process</span> {
        [pscustomobject]@{
            Id   = <span>$Id</span>
            Name = <span>$_</span>.opened_by
        }
    } | <span>Export-Csv</span> .\Output2.csv
}

<span>'Unwrapped = {0:N2} ms'</span><span> -f</span> <span>$measure</span>.TotalMilliseconds
</span>
```

```
Unwrapped = 42.92 ms
```

The unwrapped example is **372 times faster**. Also, notice that the first implementation requires the **Append** parameter, which isn't required for the later implementation.

## Avoid unnecessary collection enumeration

The [PowerShell comparison operators](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_comparison_operators) have a convience feature when comparing collections. When the left-hand value in the expression is a collection, the operator returns the elements of the collection that match the right-hand value of the expression.

This feature provides a simple way to filter a collection. For example:

```
<span>PS&gt; <span>$Collection</span> = <span>1</span>..<span>99</span>
PS&gt; (<span>$Collection</span><span> -like</span> <span>'*1*'</span>)<span> -join</span> <span>' '</span>

<span>1</span> <span>10</span> <span>11</span> <span>12</span> <span>13</span> <span>14</span> <span>15</span> <span>16</span> <span>17</span> <span>18</span> <span>19</span> <span>21</span> <span>31</span> <span>41</span> <span>51</span> <span>61</span> <span>71</span> <span>81</span> <span>91</span>
</span>
```

However, when you use a collection comparison in a conditional statement that only expects a [boolean](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_booleans) result, this feature can result in poor performance.

Take for example:

```
<span><span>if</span> (<span>$Collection</span><span> -like</span> <span>'*1*'</span>) { <span>'Found'</span> }
</span>
```

In this example, PowerShell compares the right-hand value to every value in the collection and returns a collection of results. Since the result isn't empty, the non-null result evaluates as `$true`. The condition is true when the first match is found, but PowerShell still enumerates the entire collection. This enumeration can have a significant performance impact for large collections.

One way to improve performance is to use the [`Where()`](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_arrays#where) method of the collection. The `Where()` method stops evaluating the collection after it finds the first match.

```
<span><span># Create an array of 1048576 items</span>
<span>$Collection</span> = <span>foreach</span> (<span>$x</span> <span>in</span> <span>1</span>..<span>1</span>MB) { <span>$x</span> }
(<span>Measure-Command</span> { <span>if</span> (<span>$Collection</span><span> -like</span> <span>'*1*'</span>) { <span>'Found'</span> } }).TotalMilliseconds
<span>633.3695</span>
(<span>Measure-Command</span> { <span>if</span> (<span>$Collection</span>.Where({ <span>$_</span><span> -like</span> <span>'*1*'</span> }, <span>'first'</span>)) { <span>'Found'</span> } }).TotalMilliseconds
<span>2.607</span>
</span>
```

For a million items, using the `Where()` method is significantly faster.

## Object creation

Creating objects using the `New-Object` cmdlet can be slow. The following code compares the performance of creating objects using the `New-Object` cmdlet to the `[pscustomobject]` type accelerator.

```
<span><span>Measure-Command</span> {
    <span>$test</span> = <span>'PSCustomObject'</span>
    <span>for</span> (<span>$i</span> = <span>0</span>; <span>$i</span><span> -lt</span> <span>100000</span>; <span>$i</span>++) {
        <span>$resultObject</span> = [pscustomobject]@{
            Name = <span>'Name'</span>
            Path = <span>'FullName'</span>
        }
    }
} | <span>Select-Object</span> @{n=<span>'Test'</span>;e={<span>$test</span>}},TotalSeconds

<span>Measure-Command</span> {
    <span>$test</span> = <span>'New-Object'</span>
    <span>for</span> (<span>$i</span> = <span>0</span>; <span>$i</span><span> -lt</span> <span>100000</span>; <span>$i</span>++) {
        <span>$resultObject</span> = <span>New-Object</span><span> -TypeName</span> psobject<span> -Property</span> @{
            Name = <span>'Name'</span>
            Path = <span>'FullName'</span>
        }
    }
} | <span>Select-Object</span> @{n=<span>'Test'</span>;e={<span>$test</span>}},TotalSeconds
</span>
```

```
Test           TotalSeconds
----           ------------
PSCustomObject         0.48
New-Object             3.37
```

PowerShell 5.0 added the `new()` static method for all .NET types. The following code compares the performance of creating objects using the `New-Object` cmdlet to the `new()` method.

```
<span><span>Measure-Command</span> {
    <span>$test</span> = <span>'new() method'</span>
    <span>for</span> (<span>$i</span> = <span>0</span>; <span>$i</span><span> -lt</span> <span>100000</span>; <span>$i</span>++) {
        <span>$sb</span> = [System.Text.StringBuilder]::new(<span>1000</span>)
    }
} | <span>Select-Object</span> @{n=<span>'Test'</span>;e={<span>$test</span>}},TotalSeconds

<span>Measure-Command</span> {
    <span>$test</span> = <span>'New-Object'</span>
    <span>for</span> (<span>$i</span> = <span>0</span>; <span>$i</span><span> -lt</span> <span>100000</span>; <span>$i</span>++) {
        <span>$sb</span> = <span>New-Object</span><span> -TypeName</span> System.Text.StringBuilder<span> -ArgumentList</span> <span>1000</span>
    }
} | <span>Select-Object</span> @{n=<span>'Test'</span>;e={<span>$test</span>}},TotalSeconds
</span>
```

```
Test         TotalSeconds
----         ------------
new() method         0.59
New-Object           3.17
```

## Use OrderedDictionary to dynamically create new objects

There are situations where we may need to dynamically create objects based on some input, the perhaps most commonly used way to create a new **PSObject** and then add new properties using the `Add-Member` cmdlet. The performance cost for small collections using this technique may be negligible however it can become very noticeable for big collections. In that case, the recommended approach is to use an `[OrderedDictionary]` and then convert it to a **PSObject** using the `[pscustomobject]` type accelerator. For more information, see the _Creating ordered dictionaries_ section of [about\_Hash\_Tables](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_hash_tables#creating-ordered-dictionaries).

Assume you have the following API response stored in the variable `$json`.

```
<span>{
  <span>"tables"</span>: [
    {
      <span>"name"</span>: <span>"PrimaryResult"</span>,
      <span>"columns"</span>: [
        { <span>"name"</span>: <span>"Type"</span>, <span>"type"</span>: <span>"string"</span> },
        { <span>"name"</span>: <span>"TenantId"</span>, <span>"type"</span>: <span>"string"</span> },
        { <span>"name"</span>: <span>"count_"</span>, <span>"type"</span>: <span>"long"</span> }
      ],
      <span>"rows"</span>: [
        [ <span>"Usage"</span>, <span>"63613592-b6f7-4c3d-a390-22ba13102111"</span>, <span>"1"</span> ],
        [ <span>"Usage"</span>, <span>"d436f322-a9f4-4aad-9a7d-271fbf66001c"</span>, <span>"1"</span> ],
        [ <span>"BillingFact"</span>, <span>"63613592-b6f7-4c3d-a390-22ba13102111"</span>, <span>"1"</span> ],
        [ <span>"BillingFact"</span>, <span>"d436f322-a9f4-4aad-9a7d-271fbf66001c"</span>, <span>"1"</span> ],
        [ <span>"Operation"</span>, <span>"63613592-b6f7-4c3d-a390-22ba13102111"</span>, <span>"7"</span> ],
        [ <span>"Operation"</span>, <span>"d436f322-a9f4-4aad-9a7d-271fbf66001c"</span>, <span>"5"</span> ]
      ]
    }
  ]
}
</span>
```

Now, suppose you want to export this data to a CSV. First you need to create new objects and add the properties and values using the `Add-Member` cmdlet.

```
<span><span>$data</span> = <span>$json</span> | <span>ConvertFrom-Json</span>
<span>$columns</span> = <span>$data</span>.tables.columns
<span>$result</span> = <span>foreach</span> (<span>$row</span> <span>in</span> <span>$data</span>.tables.rows) {
    <span>$obj</span> = [psobject]::new()
    <span>$index</span> = <span>0</span>

    <span>foreach</span> (<span>$column</span> <span>in</span> <span>$columns</span>) {
        <span>$obj</span> | <span>Add-Member</span><span> -MemberType</span> NoteProperty<span> -Name</span> <span>$column</span>.name<span> -Value</span> <span>$row</span>[<span>$index</span>++]
    }

    <span>$obj</span>
}
</span>
```

Using an `OrderedDictionary`, the code can be translated to:

```
<span><span>$data</span> = <span>$json</span> | <span>ConvertFrom-Json</span>
<span>$columns</span> = <span>$data</span>.tables.columns
<span>$result</span> = <span>foreach</span> (<span>$row</span> <span>in</span> <span>$data</span>.tables.rows) {
    <span>$obj</span> = [ordered]@{}
    <span>$index</span> = <span>0</span>

    <span>foreach</span> (<span>$column</span> <span>in</span> <span>$columns</span>) {
        <span>$obj</span>[<span>$column</span>.name] = <span>$row</span>[<span>$index</span>++]
    }

    [pscustomobject] <span>$obj</span>
}
</span>
```

In both cases the `$result` output would be same:

```
Type        TenantId                             count_
----        --------                             ------
Usage       63613592-b6f7-4c3d-a390-22ba13102111 1
Usage       d436f322-a9f4-4aad-9a7d-271fbf66001c 1
BillingFact 63613592-b6f7-4c3d-a390-22ba13102111 1
BillingFact d436f322-a9f4-4aad-9a7d-271fbf66001c 1
Operation   63613592-b6f7-4c3d-a390-22ba13102111 7
Operation   d436f322-a9f4-4aad-9a7d-271fbf66001c 5
```

The latter approach becomes exponentially more efficient as the number of objects and member properties increases.

Here is a performance comparison of three techniques for creating objects with 5 properties:

```
<span><span>$tests</span> = @{
    <span>'[ordered] into [pscustomobject] cast'</span> = {
        <span>param</span>([int] <span>$Iterations</span>, [string[]] <span>$Props</span>)

        <span>foreach</span> (<span>$i</span> <span>in</span> <span>1</span>..<span>$Iterations</span>) {
            <span>$obj</span> = [ordered]@{}
            <span>foreach</span> (<span>$prop</span> <span>in</span> <span>$Props</span>) {
                <span>$obj</span>[<span>$prop</span>] = <span>$i</span>
            }
            [pscustomobject] <span>$obj</span>
        }
    }
    <span>'Add-Member'</span>                           = {
        <span>param</span>([int] <span>$Iterations</span>, [string[]] <span>$Props</span>)

        <span>foreach</span> (<span>$i</span> <span>in</span> <span>1</span>..<span>$Iterations</span>) {
            <span>$obj</span> = [psobject]::new()
            <span>foreach</span> (<span>$prop</span> <span>in</span> <span>$Props</span>) {
                <span>$obj</span> | <span>Add-Member</span><span> -MemberType</span> NoteProperty<span> -Name</span> <span>$prop</span><span> -Value</span> <span>$i</span>
            }
            <span>$obj</span>
        }
    }
    <span>'PSObject.Properties.Add'</span>              = {
        <span>param</span>([int] <span>$Iterations</span>, [string[]] <span>$Props</span>)

        <span># this is how, behind the scenes, `Add-Member` attaches</span>
        <span># new properties to our PSObject.</span>
        <span># Worth having it here for performance comparison</span>

        <span>foreach</span> (<span>$i</span> <span>in</span> <span>1</span>..<span>$Iterations</span>) {
            <span>$obj</span> = [psobject]::new()
            <span>foreach</span> (<span>$prop</span> <span>in</span> <span>$Props</span>) {
                <span>$obj</span>.psobject.Properties.Add(
                    [psnoteproperty]::new(<span>$prop</span>, <span>$i</span>))
            }
            <span>$obj</span>
        }
    }
}

<span>$properties</span> = <span>'Prop1'</span>, <span>'Prop2'</span>, <span>'Prop3'</span>, <span>'Prop4'</span>, <span>'Prop5'</span>

<span>1</span>kb, <span>10</span>kb, <span>100</span>kb | <span>ForEach-Object</span> {
    <span>$groupResult</span> = <span>foreach</span> (<span>$test</span> <span>in</span> <span>$tests</span>.GetEnumerator()) {
        <span>$ms</span> = <span>Measure-Command</span> { &amp; <span>$test</span>.Value<span> -Iterations</span> <span>$_</span><span> -Props</span> <span>$properties</span> }

        [pscustomobject]@{
            Iterations        = <span>$_</span>
            Test              = <span>$test</span>.Key
            TotalMilliseconds = [Math]::Round(<span>$ms</span>.TotalMilliseconds, <span>2</span>)
        }

        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }

    <span>$groupResult</span> = <span>$groupResult</span> | <span>Sort-Object</span> TotalMilliseconds
    <span>$groupResult</span> | <span>Select-Object</span> *, @{
        Name       = <span>'RelativeSpeed'</span>
        Expression = {
            <span>$relativeSpeed</span> = <span>$_</span>.TotalMilliseconds / <span>$groupResult</span>[<span>0</span>].TotalMilliseconds
            [Math]::Round(<span>$relativeSpeed</span>, <span>2</span>).ToString() + <span>'x'</span>
        }
    }
}
</span>
```

And these are the results:

```
Iterations Test                                 TotalMilliseconds RelativeSpeed
---------- ----                                 ----------------- -------------
      1024 [ordered] into [pscustomobject] cast             22.00 1x
      1024 PSObject.Properties.Add                         153.17 6.96x
      1024 Add-Member                                      261.96 11.91x
     10240 [ordered] into [pscustomobject] cast             65.24 1x
     10240 PSObject.Properties.Add                        1293.07 19.82x
     10240 Add-Member                                     2203.03 33.77x
    102400 [ordered] into [pscustomobject] cast            639.83 1x
    102400 PSObject.Properties.Add                       13914.67 21.75x
    102400 Add-Member                                    23496.08 36.72x
```

-   [`$null`](https://learn.microsoft.com/en-us/powershell/scripting/learn/deep-dives/everything-about-hashtable?view=powershell-7.6)
-   [System.Void](https://learn.microsoft.com/en-us/dotnet/api/system.void)
-   [Out-Null](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/out-null?view=powershell-7.6)
-   [List<T>](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1)
-   [Add(T) method](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.add)
-   [System.String](https://learn.microsoft.com/en-us/dotnet/api/system.string)
-   [System.Int32](https://learn.microsoft.com/en-us/dotnet/api/system.int32)
-   [System.Object](https://learn.microsoft.com/en-us/dotnet/api/system.object)
-   [ToArray() method](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.toarray#system-collections-generic-list-1-toarray)
-   [System.Collections.ArrayList](https://learn.microsoft.com/en-us/dotnet/api/system.collections.arraylist)
-   [System.Text.StringBuilder](https://learn.microsoft.com/en-us/dotnet/api/system.text.stringbuilder)
-   [System.IO.StreamReader](https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader)
-   [File::ReadLines() method](https://learn.microsoft.com/en-us/dotnet/api/system.io.file.readlines)
-   [Write-Host](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/write-host?view=powershell-7.6)
-   [Add-Member](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/add-member?view=powershell-7.6)