from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class DefuddleResponse(BaseModel):
    """
    Represents the structured response from a Defuddle parsing operation.
    It contains the extracted content and metadata from the webpage.
    """

    model_config = ConfigDict(extra="allow", populate_by_name=True)

    content: str = Field(
        description="Cleaned up string of the extracted content (Markdown or HTML)."
    )

    title: Optional[str] = Field(default=None, description="Title of the article.")
    author: Optional[str] = Field(default=None, description="Author of the article.")
    description: Optional[str] = Field(
        default=None, description="Description or summary of the article."
    )
    domain: Optional[str] = Field(
        default=None, description="Domain name of the website."
    )
    source: Optional[str] = Field(default=None, description="The original parsed URL.")
    favicon: Optional[str] = Field(
        default=None, description="URL of the website's favicon."
    )
    image: Optional[str] = Field(
        default=None, description="URL of the article's main image."
    )
    language: Optional[str] = Field(
        default=None, description="Language of the page in BCP 47 format."
    )
    published: Optional[str] = Field(
        default=None, description="Publication date of the article."
    )
    site: Optional[str] = Field(default=None, description="Name of the website.")
    word_count: Optional[int] = Field(
        default=None,
        alias="wordCount",
        description="Total number of words in the extracted content.",
    )

    parse_time: Optional[int] = Field(
        default=None,
        alias="parseTime",
        description="Time taken to parse the page in milliseconds.",
    )

    # These fields might be available depending on the backend (API vs Local)
    schema_org_data: Optional[dict[str, Any]] = Field(
        default=None, alias="schemaOrgData"
    )
    meta_tags: Optional[dict[str, str]] = Field(default=None, alias="metaTags")
    debug: Optional[dict[str, Any]] = Field(default=None)
