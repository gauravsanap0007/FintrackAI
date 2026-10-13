from decimal import Decimal
from django.db import transaction
from apps.accounts.models import Account


def apply_transaction_to_balance(txn):
    """Adjusts account balance(s) when a transaction is added or updated."""
    account = Account.objects.select_for_update().get(pk=txn.account_id)
    amount = Decimal(str(txn.amount))

    if txn.transaction_type == 'EXPENSE':
        account.balance -= amount
        account.save(update_fields=['balance'])
    elif txn.transaction_type == 'INCOME':
        account.balance += amount
        account.save(update_fields=['balance'])
    elif txn.transaction_type == 'TRANSFER' and txn.transfer_to_account_id:
        account.balance -= amount
        account.save(update_fields=['balance'])

        to_acc = Account.objects.select_for_update().get(pk=txn.transfer_to_account_id)
        to_acc.balance += amount
        to_acc.save(update_fields=['balance'])


def revert_transaction_from_balance(txn):
    """Reverts account balance(s) when a transaction is deleted or before being updated."""
    account = Account.objects.select_for_update().get(pk=txn.account_id)
    amount = Decimal(str(txn.amount))

    if txn.transaction_type == 'EXPENSE':
        account.balance += amount
        account.save(update_fields=['balance'])
    elif txn.transaction_type == 'INCOME':
        account.balance -= amount
        account.save(update_fields=['balance'])
    elif txn.transaction_type == 'TRANSFER' and txn.transfer_to_account_id:
        account.balance += amount
        account.save(update_fields=['balance'])

        to_acc = Account.objects.select_for_update().get(pk=txn.transfer_to_account_id)
        to_acc.balance -= amount
        to_acc.save(update_fields=['balance'])
