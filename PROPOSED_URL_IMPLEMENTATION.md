# Proposed URL Implementation Summary

## Overview
Added support for a `proposed_url` field to the news receiving API that allows n8n to specify custom URL paths for articles instead of using the default slug-based URLs.

## Changes Made

### 1. Article Model (`backend/articles/models.py`)
- **Added field**: `proposed_url = models.CharField(max_length=500, blank=True, null=True, help_text="Custom URL path for this article (optional)")`
- **Added property**: `article_url` property that returns the proposed URL if available, otherwise falls back to slug-based URL (`/article/{slug}`)
- **URL cleaning**: Ensures proposed URLs start with `/` for consistency

### 2. ArticleIngestSerializer (`backend/articles/serializers.py`)
- **Added field**: `proposed_url = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=500)`
- **Updated fields list**: Added `proposed_url` to the serializer fields
- **Updated create method**: Now handles the `proposed_url` field during article creation

### 3. ArticleSerializer (`backend/articles/serializers.py`)
- **Added field**: `article_url = serializers.ReadOnlyField()` to expose the computed URL
- **Updated fields list**: Added both `proposed_url` and `article_url` to API responses
- **Updated social_metadata**: Now uses the `article_url` property for consistent URL generation

### 4. Database Migration
- **Created migration**: `0006_article_proposed_url.py` to add the new field to the database
- **Applied migration**: Successfully applied to add the field to existing database

## API Usage

### Request Format
The n8n webhook can now send a `proposed_url` field:

```json
{
  "title": "ރައްޔިތުން ހުރިހާ އެސީ",
  "content": "<p>Full HTML article content...</p>",
  "proposed_url": "/custom/article/path",
  "image_url": "https://example.com/image.jpg"
}
```

### Response Format
The API now returns both the raw `proposed_url` and the computed `article_url`:

```json
{
  "id": 123,
  "title": "ރައްޔިތުން ހުރިހާ އެސީ",
  "slug": "article-slug",
  "proposed_url": "/custom/article/path",
  "article_url": "/custom/article/path",
  "content": "<p>Full HTML article content...</p>",
  "status": "draft"
}
```

## URL Logic

1. **If `proposed_url` is provided**: Uses the proposed URL (cleaned to ensure it starts with `/`)
2. **If `proposed_url` is empty/null**: Falls back to slug-based URL (`/article/{slug}`)
3. **Social metadata**: Uses the computed `article_url` for consistent sharing URLs

## Testing

A test script `test_proposed_url.py` has been created to verify the functionality. To test:

1. Start the Django server: `export USE_MEMORY_CACHE=true && export TESTING=true && python manage.py runserver 0.0.0.0:8000`
2. Run the test: `python test_proposed_url.py`

## Benefits

1. **Flexible URL structure**: Allows custom URL paths for articles
2. **Backward compatibility**: Existing articles continue to use slug-based URLs
3. **Consistent API**: All URL generation uses the same logic through the `article_url` property
4. **SEO friendly**: Allows for more descriptive and structured URLs

## n8n Integration

The n8n workflow can now use `{{ $json.proposed_url }}` to set custom URLs for articles, providing more control over the URL structure and improving SEO capabilities.
