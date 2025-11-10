"""
Dedicated Theme Customization Admin Page
This creates a standalone admin page for theme customization that appears in the admin sidebar
"""
from django.contrib import admin
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils.html import format_html
from django.urls import path, reverse
from django import forms
from .models import SiteSettings
from .admin_widgets import ThemeCustomizationWidget
import json


class ThemeConfigField(forms.Field):
    """Custom form field for theme config that handles dict/JSON conversion"""
    
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('required', False)
        kwargs.setdefault('widget', ThemeCustomizationWidget())
        super().__init__(*args, **kwargs)
    
    def to_python(self, value):
        """Convert value to dict - widget returns dict from value_from_datadict"""
        if value is None or value == '':
            return {}
        if isinstance(value, dict):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return {}
        return value
    
    def prepare_value(self, value):
        """Prepare value for widget (widget expects dict or JSON string)"""
        if value is None or value == '':
            return {}
        if isinstance(value, dict):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return {}
        return value
    
    def clean(self, value):
        """Clean and return dict"""
        value = super().clean(value)
        return self.to_python(value)


class ThemeCustomizationForm(forms.Form):
    """Form for theme customization"""
    active_theme = forms.ChoiceField(
        choices=[
            ('modern', 'Modern News'),
            ('classic', 'Classic Blog'),
            ('minimal', 'Minimal Clean'),
            ('newspaper', 'Newspaper Style'),
            ('magazine', 'Magazine Layout'),
        ],
        required=True,
        widget=forms.Select(attrs={
            'style': 'width: 300px; padding: 8px; font-size: 14px;',
        })
    )
    theme_config = ThemeConfigField(
        widget=ThemeCustomizationWidget(),
        help_text='Customize your theme colors, fonts, and spacing using the interactive controls below.'
    )


class ThemeCustomizationAdmin:
    """Admin interface for theme customization"""
    
    def __init__(self, admin_site):
        self.admin_site = admin_site
        self.name = 'theme_customization'
        self.app_label = 'theme'
        self.verbose_name = 'Theme Customization'
        self.verbose_name_plural = 'Theme Customization'
    
    def get_urls(self):
        """Get URLs for theme customization"""
        urls = [
            path('theme-customization/', self.admin_site.admin_view(self.theme_customization_view), name='theme_customization'),
        ]
        return urls
    
    def theme_customization_view(self, request):
        """Main theme customization view"""
        settings = SiteSettings.get_settings()
        
        if request.method == 'POST':
            try:
                # Use form to validate and clean data
                form = ThemeCustomizationForm(request.POST)
                if form.is_valid():
                    active_theme = form.cleaned_data['active_theme']
                    theme_config = form.cleaned_data['theme_config']  # Already a dict from widget
                else:
                    # Fallback if form validation fails
                    active_theme = request.POST.get('active_theme', settings.active_theme)
                    theme_config_json = request.POST.get('theme_config', '{}')
                    try:
                        theme_config = json.loads(theme_config_json) if theme_config_json else {}
                    except (json.JSONDecodeError, TypeError):
                        theme_config = {}
                    messages.warning(request, 'Form validation had issues, but settings were saved.')
                
                # Update settings
                settings.active_theme = active_theme
                settings.theme_config = theme_config
                settings.save()
                
                # Clear cache
                from django.core.cache import cache
                cache.delete('public_site_settings')
                
                messages.success(request, 'Theme settings saved successfully!')
                return redirect('admin:theme_customization')
                
            except Exception as e:
                messages.error(request, f'Error saving theme settings: {str(e)}')
        
        # Prepare form with current values
        # Note: theme_config widget expects a dict or JSON string
        theme_config_value = settings.theme_config if settings.theme_config else {}
        if isinstance(theme_config_value, str):
            try:
                theme_config_value = json.loads(theme_config_value)
            except:
                theme_config_value = {}
        
        initial_data = {
            'active_theme': settings.active_theme or 'modern',
            'theme_config': theme_config_value,  # Pass dict directly, widget will handle it
        }
        
        form = ThemeCustomizationForm(initial=initial_data)
        
        # Get theme descriptions
        theme_descriptions = {
            'modern': {
                'name': 'Modern News',
                'description': 'Clean, modern design with featured article and grid layout',
                'color': '#0073e6',
                'icon': '📰'
            },
            'classic': {
                'name': 'Classic Blog',
                'description': 'Traditional blog layout with sidebar, warm colors, serif fonts',
                'color': '#f08c2c',
                'icon': '📖'
            },
            'minimal': {
                'name': 'Minimal Clean',
                'description': 'Minimalist design with lots of whitespace, simple typography',
                'color': '#505050',
                'icon': '✨'
            },
            'newspaper': {
                'name': 'Newspaper Style',
                'description': 'Traditional newspaper layout with multi-column grid',
                'color': '#424242',
                'icon': '📰'
            },
            'magazine': {
                'name': 'Magazine Layout',
                'description': 'Bold, visual design with large featured images, asymmetric layouts',
                'color': '#e53e3e',
                'icon': '📸'
            },
        }
        
        current_theme = settings.active_theme or 'modern'
        current_theme_info = theme_descriptions.get(current_theme, theme_descriptions['modern'])
        
        context = {
            **self.admin_site.each_context(request),
            'title': 'Theme Customization',
            'form': form,
            'current_theme': current_theme,
            'current_theme_info': current_theme_info,
            'theme_descriptions': theme_descriptions,
            'opts': {
                'app_label': 'theme',
                'model_name': 'customization',
                'verbose_name': 'Theme Customization',
                'verbose_name_plural': 'Theme Customization',
            },
            'has_view_permission': True,
            'has_add_permission': False,
            'has_change_permission': True,
            'has_delete_permission': False,
        }
        
        return render(request, 'admin/theme_customization.html', context)
    
    def get_model_perms(self, request):
        """Return model permissions"""
        return {
            'add': False,
            'change': True,
            'delete': False,
            'view': True,
        }


# Create a template for the theme customization page
THEME_CUSTOMIZATION_TEMPLATE = """
{% extends "admin/base_site.html" %}
{% load static %}

{% block title %}Theme Customization | {{ site_title|default:_('Django site admin') }}{% endblock %}

{% block breadcrumbs %}
<div class="breadcrumbs">
    <a href="{% url 'admin:index' %}">Home</a>
    &rsaquo; Theme Customization
</div>
{% endblock %}

{% block content %}
<div class="theme-customization-admin">
    <h1>🎨 Theme Customization</h1>
    
    <div class="theme-info-box" style="background: #f0f7ff; padding: 20px; border-left: 4px solid {{ current_theme_info.color }}; margin: 20px 0; border-radius: 4px;">
        <h2 style="margin-top: 0; color: {{ current_theme_info.color }};">
            {{ current_theme_info.icon }} {{ current_theme_info.name }}
        </h2>
        <p style="color: #666; margin-bottom: 0;">{{ current_theme_info.description }}</p>
    </div>
    
    <form method="post" id="theme-customization-form">
        {% csrf_token %}
        
        <div class="form-section" style="background: white; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0;">Theme Selection</h2>
            <div class="form-row">
                <label for="{{ form.active_theme.id_for_label }}" style="display: block; margin-bottom: 8px; font-weight: bold;">
                    Active Theme:
                </label>
                {{ form.active_theme }}
                <p class="help" style="margin-top: 8px; color: #666; font-size: 13px;">
                    Select the base theme for your site. You can customize colors, fonts, and spacing below.
                </p>
            </div>
        </div>
        
        <div class="form-section" style="background: white; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0;">Theme Customization</h2>
            <div class="form-row">
                {{ form.theme_config }}
            </div>
        </div>
        
        <div class="submit-row" style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <input type="submit" value="Save Theme Settings" class="default" style="background: #0073e6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">
            <p class="deletelink-box" style="margin-top: 10px;">
                <a href="{% url 'admin:settings_app_sitesettings_changelist' %}" style="color: #ba2121;">
                    View All Site Settings
                </a>
            </p>
        </div>
    </form>
</div>

<style>
.theme-customization-admin {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.theme-customization-admin h1 {
    color: #333;
    margin-bottom: 20px;
}

.form-section {
    margin-bottom: 30px;
}

.form-section h2 {
    color: #333;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 10px;
    margin-bottom: 20px;
}

.submit-row input[type="submit"]:hover {
    background: #005cb3 !important;
}
</style>
{% endblock %}
"""

