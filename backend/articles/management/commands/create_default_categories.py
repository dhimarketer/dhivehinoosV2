"""
Management command to create default categories for article categorization
"""

from django.core.management.base import BaseCommand
from articles.models import Category


class Command(BaseCommand):
    help = 'Create default categories for article categorization'

    def handle(self, *args, **options):
        default_categories = [
            {
                'name': 'Opinion',
                'description': 'Local opinions, social commentary, and personal perspectives from Maldivian social media',
                'color': '#8B5CF6',
                'icon': '💭',
                'keywords': 'opinion, think, believe, feel, perspective, view, thought, social media, twitter, facebook, instagram, maldives, dhivehi, local, community, discussion, debate, sentiment, reaction, response, comment, post, tweet, status, update, share, viral, trending, hashtag',
                'regex_patterns': r'\b(opinion|think|believe|feel|perspective|view|thought|social media|twitter|facebook|instagram|maldives|dhivehi|local|community|discussion|debate|sentiment|reaction|response|comment|post|tweet|status|update|share|viral|trending|hashtag)\b',
                'sort_order': 1
            },
            {
                'name': 'Politics',
                'description': 'Political news, government affairs, and policy updates',
                'color': '#DC2626',
                'icon': '🏛️',
                'keywords': 'politics, government, president, minister, parliament, election, vote, policy, law, bill, majlis, president ibrahim mohamed solih, president mohamed muizzu, mp, member of parliament, political party, mdp, pnc, pnf, coalition, opposition, ruling party, government policy, legislation, constitutional, democracy, governance',
                'regex_patterns': r'\b(president|minister|parliament|election|vote|policy|law|bill|majlis|president ibrahim mohamed solih|president mohamed muizzu|mp|member of parliament|political party|mdp|pnc|pnf|coalition|opposition|ruling party|government policy|legislation|constitutional|democracy|governance)\b',
                'sort_order': 2
            },
            {
                'name': 'Economy',
                'description': 'Economic news, business updates, and financial information',
                'color': '#059669',
                'icon': '💰',
                'keywords': 'economy, business, finance, money, market, stock, investment, trade, budget, economic, financial, bank, maldives economy, maldivian economy, tourism, fishing, agriculture, industry, commerce',
                'regex_patterns': r'\b(economy|business|finance|money|market|stock|investment|trade|budget|economic|financial|bank|maldives economy|maldivian economy|tourism|fishing|agriculture|industry|commerce)\b',
                'sort_order': 3
            },
            {
                'name': 'Sports',
                'description': 'Sports news, match results, and athlete updates',
                'color': '#7C3AED',
                'icon': '⚽',
                'keywords': 'sports, football, soccer, basketball, cricket, tennis, olympics, match, game, player, team, championship, maldives sports, maldivian sports',
                'regex_patterns': r'\b(sports|football|soccer|basketball|cricket|tennis|olympics|match|game|player|team|championship|maldives sports|maldivian sports)\b',
                'sort_order': 4
            },
            {
                'name': 'Technology',
                'description': 'Technology news, innovations, and digital developments',
                'color': '#2563EB',
                'icon': '💻',
                'keywords': 'technology, tech, computer, software, app, digital, internet, ai, artificial intelligence, mobile, smartphone, maldives tech, maldivian tech',
                'regex_patterns': r'\b(technology|tech|computer|software|app|digital|internet|ai|artificial intelligence|mobile|smartphone|maldives tech|maldivian tech)\b',
                'sort_order': 5
            },
            {
                'name': 'Health',
                'description': 'Health news, medical updates, and wellness information',
                'color': '#DC2626',
                'icon': '🏥',
                'keywords': 'health, medical, doctor, hospital, medicine, treatment, disease, illness, wellness, healthcare, covid, maldives health, maldivian health',
                'regex_patterns': r'\b(health|medical|doctor|hospital|medicine|treatment|disease|illness|wellness|healthcare|covid|maldives health|maldivian health)\b',
                'sort_order': 6
            },
            {
                'name': 'Education',
                'description': 'Education news, school updates, and academic information',
                'color': '#0891B2',
                'icon': '📚',
                'keywords': 'education, school, university, college, student, teacher, exam, study, academic, learning, curriculum, maldives education, maldivian education',
                'regex_patterns': r'\b(education|school|university|college|student|teacher|exam|study|academic|learning|curriculum|maldives education|maldivian education)\b',
                'sort_order': 7
            },
            {
                'name': 'Environment',
                'description': 'Environmental news, climate updates, and sustainability',
                'color': '#16A34A',
                'icon': '🌱',
                'keywords': 'environment, climate, weather, pollution, conservation, sustainability, green, renewable, energy, nature, maldives environment, maldivian environment, climate change, coral reef',
                'regex_patterns': r'\b(environment|climate|weather|pollution|conservation|sustainability|green|renewable|energy|nature|maldives environment|maldivian environment|climate change|coral reef)\b',
                'sort_order': 8
            },
            {
                'name': 'Entertainment',
                'description': 'Entertainment news, celebrity updates, and cultural events',
                'color': '#EAB308',
                'icon': '🎬',
                'keywords': 'entertainment, celebrity, movie, music, film, actor, singer, artist, culture, festival, show, maldives entertainment, maldivian entertainment, maldivian culture',
                'regex_patterns': r'\b(entertainment|celebrity|movie|music|film|actor|singer|artist|culture|festival|show|maldives entertainment|maldivian entertainment|maldivian culture)\b',
                'sort_order': 9
            },
            {
                'name': 'International',
                'description': 'International news and global affairs',
                'color': '#9333EA',
                'icon': '🌍',
                'keywords': 'international, global, world, foreign, country, nation, diplomatic, embassy, un, united nations, maldives international, maldivian international',
                'regex_patterns': r'\b(international|global|world|foreign|country|nation|diplomatic|embassy|un|united nations|maldives international|maldivian international)\b',
                'sort_order': 10
            },
            {
                'name': 'Local News',
                'description': 'Local community news and regional updates',
                'color': '#EA580C',
                'icon': '🏘️',
                'keywords': 'local, community, regional, city, town, village, neighborhood, municipal, local government, council, maldives local, maldivian local',
                'regex_patterns': r'\b(local|community|regional|city|town|village|neighborhood|municipal|local government|council|maldives local|maldivian local)\b',
                'sort_order': 11
            }
        ]

        created_count = 0
        for category_data in default_categories:
            category, created = Category.objects.get_or_create(
                name=category_data['name'],
                defaults=category_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} new categories')
        )