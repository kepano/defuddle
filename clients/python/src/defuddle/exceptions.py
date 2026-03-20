class DefuddleError(Exception):
    """Base exception for all Defuddle client errors."""

    pass


class DefuddleAPIError(DefuddleError):
    """Raised when the Defuddle HTTP API returns an error or fails to connect."""

    pass


class DefuddleLocalError(DefuddleError):
    """Raised when the local Node.js Defuddle CLI fails (e.g. Node not missing, or parsing fails)."""

    pass


class ParseError(DefuddleError):
    """Raised when the output could not be parsed into a valid DefuddleResponse."""

    pass
