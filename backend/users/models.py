from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserAddress(models.Model):
    """
    Saved billing/shipping addresses for users.
    Allows returning customers to quickly select previously used addresses.
    """
    user = models.ForeignKey(
        User,
        related_name='addresses',
        on_delete=models.CASCADE
    )
    label = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional label like 'Home' or 'Work'"
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=2, default='US')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']
        verbose_name_plural = 'User addresses'

    def __str__(self):
        label_part = f" ({self.label})" if self.label else ""
        return f"{self.first_name} {self.last_name}{label_part} - {self.city}, {self.country}"

    def save(self, *args, **kwargs):
        # If this address is set as default, unset other defaults for this user
        if self.is_default:
            UserAddress.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)