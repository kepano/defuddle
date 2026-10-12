```json
{
  "title": "Register operations",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

This procedure describes how a receiver processes an encoded state after transmission. The sender prepares a collection of physical systems and applies an encoding operation before delivering the result. The receiver uses a decoding operation to recover the original information. Each operation acts on a specified group of systems rather than on the entire collection. The names attached to these groups distinguish the input from the output and make the instructions precise. Intermediate states may contain errors introduced during transmission. The decoding procedure identifies those errors and corrects them without changing the information that the sender intended to convey. The ordering of the operations is therefore important.

The steps below describe the final part of that procedure. Read each instruction in order and keep the named systems separate throughout the calculation. An operation written beside a system name applies only to that system. A dagger denotes the inverse operation in this example. After the inverse operations have been applied the receiver can produce the decoded state. The final instruction identifies which system contains that state. These conventions also allow the same procedure to be described in ordinary prose without equations. Both descriptions specify the same sequence of operations and the same final result.

## Algorithm

1. Decode the received state.
	1. Apply $D$ and output register $A$.
		2. Apply $U^\dagger P^\dagger$ to the received register $B$.

### Quantum register operations

Initialize the register before decoding.

Use the `register` keyword.

See the [`register`](https://example.com/reference/register) keyword.

Check `register_state` before returning.

Registered values remain unchanged.

Use the cash register carefully.

The register now contains output.

Call `register` to continue.

We register an account in this example.

Inspect register [state](https://example.com/state) before returning.