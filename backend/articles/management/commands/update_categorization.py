"""
Management command to update categories and recategorize existing articles
"""

from django.core.management.base import BaseCommand
from articles.models import Category, Article
from articles.categorization_service import categorization_service


class Command(BaseCommand):
    help = 'Update categories and recategorize existing articles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recategorize',
            action='store_true',
            help='Recategorize all existing articles',
        )
        parser.add_argument(
            '--update-categories',
            action='store_true',
            help='Update existing categories with new keywords',
        )

    def handle(self, *args, **options):
        if options['update_categories']:
            self.update_categories()
        
        if options['recategorize']:
            self.recategorize_articles()

    def update_categories(self):
        """Update existing categories with new keywords and patterns"""
        self.stdout.write('Updating categories...')
        
        # Update Opinion category
        opinion_category = Category.objects.filter(name='Opinion').first()
        if opinion_category:
            opinion_category.keywords = 'opinion, think, believe, feel, perspective, view, thought, social media, twitter, facebook, instagram, maldives, dhivehi, local, community, discussion, debate, sentiment, reaction, response, comment, post, tweet, status, update, share, viral, trending, hashtag'
            opinion_category.regex_patterns = r'\b(opinion|think|believe|feel|perspective|view|thought|social media|twitter|facebook|instagram|maldives|dhivehi|local|community|discussion|debate|sentiment|reaction|response|comment|post|tweet|status|update|share|viral|trending|hashtag)\b'
            opinion_category.save()
            self.stdout.write(self.style.SUCCESS('Updated Opinion category'))
        
        # Update Politics category
        politics_category = Category.objects.filter(name='Politics').first()
        if politics_category:
            politics_category.keywords = 'politics, government, president, minister, parliament, election, vote, policy, law, bill, majlis, president ibrahim mohamed solih, president mohamed muizzu, mp, member of parliament, political party, mdp, pnc, pnf, coalition, opposition, ruling party, government policy, legislation, constitutional, democracy, governance'
            politics_category.regex_patterns = r'\b(president|minister|parliament|election|vote|policy|law|bill|majlis|president ibrahim mohamed solih|president mohamed muizzu|mp|member of parliament|political party|mdp|pnc|pnf|coalition|opposition|ruling party|government policy|legislation|constitutional|democracy|governance)\b'
            politics_category.save()
            self.stdout.write(self.style.SUCCESS('Updated Politics category'))
        
        # Refresh categorization service cache
        categorization_service.refresh_cache()
        self.stdout.write(self.style.SUCCESS('Refreshed categorization service cache'))

    def recategorize_articles(self):
        """Recategorize all existing articles"""
        self.stdout.write('Recategorizing articles...')
        
        articles = Article.objects.all()
        recategorized_count = 0
        
        for article in articles:
            old_category = article.category
            new_category = categorization_service.categorize_article(article)
            
            if new_category and new_category != old_category:
                article.category = new_category
                article.save()
                recategorized_count += 1
                self.stdout.write(
                    f'Recategorized "{article.title}" from {old_category} to {new_category}'
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully recategorized {recategorized_count} articles')
        )
