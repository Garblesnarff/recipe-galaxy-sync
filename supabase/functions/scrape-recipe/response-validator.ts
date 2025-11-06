/**
 * Response Validation Utilities
 * Validates HTTP responses and extracted recipe data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100, quality score of the response
}

/**
 * Validate HTTP response before processing
 */
export function validateHttpResponse(
  response: Response,
  html: string,
  domain: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Check response status
  if (!response.ok) {
    errors.push(`HTTP error: ${response.status} ${response.statusText}`);
    return { isValid: false, errors, warnings, score: 0 };
  }

  // Check content type
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    errors.push(`Invalid content type: ${contentType}. Expected HTML.`);
    score -= 50;
  }

  // Check HTML content
  if (!html || html.length === 0) {
    errors.push('Empty HTML content received');
    return { isValid: false, errors, warnings, score: 0 };
  }

  // Check minimum content length
  if (html.length < 500) {
    errors.push(`HTML content too short (${html.length} bytes). Likely error page.`);
    score -= 40;
  }

  // Check for valid HTML structure
  if (!html.includes('<html') && !html.includes('<HTML')) {
    errors.push('Missing <html> tag. Response may not be valid HTML.');
    score -= 30;
  }

  if (!html.includes('<body') && !html.includes('<BODY')) {
    warnings.push('Missing <body> tag. HTML structure may be incomplete.');
    score -= 10;
  }

  // Check for error indicators
  const errorIndicators = [
    'access denied',
    'forbidden',
    'blocked',
    'captcha',
    'cloudflare',
    'please verify you are a human',
    'security check',
    'rate limit',
    'too many requests'
  ];

  const htmlLower = html.toLowerCase();
  for (const indicator of errorIndicators) {
    if (htmlLower.includes(indicator)) {
      errors.push(`Detected blocking/error indicator: "${indicator}"`);
      score -= 40;
    }
  }

  // Check for JavaScript redirect or required JS
  if (htmlLower.includes('window.location') ||
      htmlLower.includes('document.location')) {
    warnings.push('JavaScript redirect detected. May need browser rendering.');
    score -= 20;
  }

  // Check for common error pages
  if (htmlLower.includes('404') && htmlLower.includes('not found')) {
    errors.push('Appears to be 404 error page');
    score -= 50;
  }

  if (htmlLower.includes('500') && htmlLower.includes('internal server error')) {
    errors.push('Appears to be 500 error page');
    score -= 50;
  }

  // Check for minimal content indicators
  const hasRecipeIndicators =
    htmlLower.includes('recipe') ||
    htmlLower.includes('ingredient') ||
    htmlLower.includes('instruction') ||
    htmlLower.includes('schema.org/recipe');

  if (!hasRecipeIndicators) {
    warnings.push('No obvious recipe indicators found in HTML');
    score -= 20;
  }

  // Final validity check
  const isValid = errors.length === 0 && score >= 30;

  return {
    isValid,
    errors,
    warnings,
    score: Math.max(0, score)
  };
}

/**
 * Validate extracted recipe data
 */
export function validateRecipeData(
  recipe: any,
  domain: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Check required fields
  if (!recipe.title || recipe.title.trim() === '') {
    errors.push('Missing or empty recipe title');
    score -= 30;
  } else if (recipe.title.length < 5) {
    warnings.push(`Recipe title very short: "${recipe.title}"`);
    score -= 10;
  } else if (recipe.title === `${domain} Recipe`) {
    warnings.push('Title is generic fallback, extraction may have failed');
    score -= 20;
  }

  // Check ingredients
  if (!recipe.ingredients) {
    errors.push('Missing ingredients field');
    score -= 30;
  } else if (!Array.isArray(recipe.ingredients)) {
    errors.push('Ingredients is not an array');
    score -= 25;
  } else if (recipe.ingredients.length === 0) {
    errors.push('No ingredients extracted');
    score -= 30;
  } else if (recipe.ingredients.length < 3) {
    warnings.push(`Very few ingredients (${recipe.ingredients.length}). May be incomplete.`);
    score -= 15;
  } else {
    // Check ingredient quality
    const emptyIngredients = recipe.ingredients.filter(
      (ing: string) => !ing || ing.trim() === ''
    ).length;

    if (emptyIngredients > 0) {
      warnings.push(`${emptyIngredients} empty ingredient entries`);
      score -= emptyIngredients * 2;
    }

    // Check for suspiciously long ingredients (might be instructions mixed in)
    const longIngredients = recipe.ingredients.filter(
      (ing: string) => ing && ing.length > 200
    );

    if (longIngredients.length > 0) {
      warnings.push(`${longIngredients.length} suspiciously long ingredients`);
      score -= 10;
    }
  }

  // Check instructions
  if (!recipe.instructions || recipe.instructions.trim() === '') {
    errors.push('Missing or empty instructions');
    score -= 30;
  } else if (recipe.instructions.length < 50) {
    warnings.push(`Instructions very short (${recipe.instructions.length} chars). May be incomplete.`);
    score -= 20;
  }

  // Check optional but important fields
  if (!recipe.image_url || recipe.image_url === '') {
    warnings.push('No recipe image URL');
    score -= 5;
  } else if (!recipe.image_url.startsWith('http')) {
    warnings.push('Image URL appears to be relative or invalid');
    score -= 5;
  }

  if (!recipe.prep_time && !recipe.cook_time) {
    warnings.push('No timing information (prep/cook time)');
    score -= 5;
  }

  if (!recipe.servings) {
    warnings.push('No servings information');
    score -= 5;
  }

  if (!recipe.description) {
    warnings.push('No recipe description');
    score -= 5;
  }

  // Check for data quality issues
  if (recipe.title && recipe.instructions) {
    const titleLower = recipe.title.toLowerCase();
    const instructionsLower = recipe.instructions.toLowerCase();

    // Check if instructions seem to be just links or navigation
    const navigationWords = ['click here', 'see more', 'view recipe', 'continue reading'];
    const hasNavigationOnly = navigationWords.some(word => instructionsLower.includes(word)) &&
                               recipe.instructions.length < 100;

    if (hasNavigationOnly) {
      errors.push('Instructions appear to be navigation links, not actual steps');
      score -= 40;
    }
  }

  // Final validity check
  const isValid = errors.length === 0 && score >= 40;

  return {
    isValid,
    errors,
    warnings,
    score: Math.max(0, score)
  };
}

/**
 * Combined validation for response and recipe data
 */
export function validateScrapeResult(
  response: Response,
  html: string,
  recipe: any,
  domain: string
): {
  httpValidation: ValidationResult;
  recipeValidation: ValidationResult;
  overallValid: boolean;
  overallScore: number;
} {
  const httpValidation = validateHttpResponse(response, html, domain);
  const recipeValidation = validateRecipeData(recipe, domain);

  const overallValid = httpValidation.isValid && recipeValidation.isValid;
  const overallScore = Math.round((httpValidation.score + recipeValidation.score) / 2);

  return {
    httpValidation,
    recipeValidation,
    overallValid,
    overallScore
  };
}

/**
 * Check if recipe data should trigger a fallback to alternative scraping method
 */
export function shouldFallback(validation: ValidationResult): boolean {
  // Fallback if invalid or score too low
  return !validation.isValid || validation.score < 50;
}

/**
 * Generate human-readable validation report
 */
export function generateValidationReport(
  httpValidation: ValidationResult,
  recipeValidation: ValidationResult
): string {
  const lines: string[] = [
    '📊 Validation Report',
    '',
    `HTTP Response: ${httpValidation.isValid ? '✅' : '❌'} (Score: ${httpValidation.score}/100)`,
  ];

  if (httpValidation.errors.length > 0) {
    lines.push('  Errors:');
    httpValidation.errors.forEach(err => lines.push(`    ❌ ${err}`));
  }

  if (httpValidation.warnings.length > 0) {
    lines.push('  Warnings:');
    httpValidation.warnings.forEach(warn => lines.push(`    ⚠️ ${warn}`));
  }

  lines.push('');
  lines.push(`Recipe Data: ${recipeValidation.isValid ? '✅' : '❌'} (Score: ${recipeValidation.score}/100)`);

  if (recipeValidation.errors.length > 0) {
    lines.push('  Errors:');
    recipeValidation.errors.forEach(err => lines.push(`    ❌ ${err}`));
  }

  if (recipeValidation.warnings.length > 0) {
    lines.push('  Warnings:');
    recipeValidation.warnings.forEach(warn => lines.push(`    ⚠️ ${warn}`));
  }

  return lines.join('\n');
}
