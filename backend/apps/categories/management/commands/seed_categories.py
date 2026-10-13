from django.core.management.base import BaseCommand
from apps.categories.services import seed_default_categories


class Command(BaseCommand):
    help = 'Seeds system default categories for income and expenses'

    def handle(self, *args, **options):
        count = seed_default_categories()
        self.stdout.write(self.style.SUCCESS(f'Successfully ensured default categories (newly added: {count}).'))
