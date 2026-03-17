```json
{
  "title": "Array - JavaScript",
  "author": "",
  "site": "MDN",
  "published": ""
}
```

## Array

The **Array** object enables storing a collection of multiple items under a single variable name, and has members for performing common array operations.

## Description

In JavaScript, arrays aren't primitives but are instead Array objects with the following core characteristics:

- **JavaScript arrays are resizable** and **can contain a mix of different data types**.
- **JavaScript arrays are not associative arrays** and so, array elements cannot be accessed using nonnumeric strings as indexes.
- **JavaScript arrays are zero-indexed**: the first element of an array is at index 0, the second is at index 1, and so on.

### Iterative methods

Several methods take as arguments functions to be called back while processing the array. When these methods are called, the length of the array is sampled, and any element added beyond this length from within the callback is not visited.

### Generic Array methods

Array methods are always generic — they don't access any internal data of the array object. They only access the array elements through the length property and the indexed elements.

## Constructor

`Array()`

Creates a new Array object.

## Static methods

`Array.from()`

Creates a new Array instance from an iterable or array-like object.

`Array.isArray()`

Returns true if the argument is an array, or false otherwise.

`Array.of()`

Creates a new Array instance with a variable number of arguments.

## Instance methods

`Array.prototype.at()`

Returns the array item at the given index.

`Array.prototype.concat()`

Returns a new array that is the calling array joined with other array(s) and/or value(s).

`Array.prototype.filter()`

Returns a new array containing all elements of the calling array for which the provided filtering function returns true.

`Array.prototype.find()`

Returns the value of the first element in the array that satisfies the provided testing function, or undefined if no appropriate element is found.

`Array.prototype.map()`

Returns a new array containing the results of invoking a function on every element in the calling array.

`Array.prototype.push()`

Adds one or more elements to the end of an array, and returns the new length of the array.

`Array.prototype.reduce()`

Executes a user-supplied "reducer" callback function on each element of the array.