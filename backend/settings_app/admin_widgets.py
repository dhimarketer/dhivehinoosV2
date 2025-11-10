from django import forms
from django.utils.html import format_html
from django.utils.safestring import mark_safe
import json


class ThemeCustomizationWidget(forms.Widget):
    """Custom widget for theme customization with color pickers, font selectors, and live preview"""
    
    def __init__(self, attrs=None):
        super().__init__(attrs)
    
    def value_from_datadict(self, data, files, name):
        """Extract the value from form data"""
        # Get the JSON string from the hidden input
        json_str = data.get(name, '{}')
        try:
            # JSONField expects a dict, not a string
            return json.loads(json_str)
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def render(self, name, value, attrs=None, renderer=None):
        """Render the theme customization widget"""
        
        # Parse current value
        try:
            if value:
                if isinstance(value, str):
                    config = json.loads(value)
                else:
                    config = value
            else:
                config = {}
        except (json.JSONDecodeError, TypeError):
            config = {}
        
        # Encode config for URL
        import urllib.parse
        config_json_encoded = urllib.parse.quote(json.dumps(config))
        
        # Get default values
        colors = config.get('colors', {})
        brand_colors = colors.get('brand', {})
        fonts = config.get('fonts', {})
        space = config.get('space', {})
        
        # Default brand color shades
        default_brand = {
            '50': brand_colors.get('50', '#e6f2ff'),
            '100': brand_colors.get('100', '#b3d9ff'),
            '200': brand_colors.get('200', '#80bfff'),
            '300': brand_colors.get('300', '#4da6ff'),
            '400': brand_colors.get('400', '#1a8cff'),
            '500': brand_colors.get('500', '#0073e6'),  # Primary
            '600': brand_colors.get('600', '#005cb3'),
            '700': brand_colors.get('700', '#004580'),
            '800': brand_colors.get('800', '#002e4d'),
            '900': brand_colors.get('900', '#00171a'),
        }
        
        # Font options
        font_options = [
            ('Inter', 'Inter (Modern Sans-serif)'),
            ('Georgia', 'Georgia (Serif)'),
            ('Times New Roman', 'Times New Roman (Serif)'),
            ('Arial', 'Arial (Sans-serif)'),
            ('Helvetica', 'Helvetica (Sans-serif)'),
            ('Roboto', 'Roboto (Sans-serif)'),
            ('Playfair Display', 'Playfair Display (Elegant Serif)'),
            ('Montserrat', 'Montserrat (Sans-serif)'),
            ('Open Sans', 'Open Sans (Sans-serif)'),
        ]
        
        current_heading_font = fonts.get('heading', 'Inter').split(',')[0].strip()
        current_body_font = fonts.get('body', 'Inter').split(',')[0].strip()
        
        # Build font option HTML
        heading_font_options = ''.join([
            f'<option value="{font[0]}" {"selected" if font[0] == current_heading_font else ""}>{font[1]}</option>'
            for font in font_options
        ])
        
        body_font_options = ''.join([
            f'<option value="{font[0]}" {"selected" if font[0] == current_body_font else ""}>{font[1]}</option>'
            for font in font_options
        ])
        
        # Spacing values
        spacing_values = {
            '4': space.get('4', '1rem'),
            '6': space.get('6', '1.5rem'),
            '8': space.get('8', '2rem'),
            '12': space.get('12', '3rem'),
            '16': space.get('16', '4rem'),
        }
        
        html = f"""
        <div id="theme-customization-{name}" class="theme-customization-widget">
            <div class="customization-header">
                <h4>🎨 Theme Customization</h4>
                <p>Customize colors, fonts, and spacing. Changes are saved automatically to the JSON config below.</p>
            </div>
            
            <div class="customization-tabs">
                <button type="button" class="tab-btn active" onclick="showCustomizationTab_{name}('colors-{name}')">Colors</button>
                <button type="button" class="tab-btn" onclick="showCustomizationTab_{name}('fonts-{name}')">Fonts</button>
                <button type="button" class="tab-btn" onclick="showCustomizationTab_{name}('spacing-{name}')">Spacing</button>
                <button type="button" class="tab-btn" onclick="showCustomizationTab_{name}('layout-{name}')">Layout</button>
            </div>
            
            <!-- Colors Tab -->
            <div id="colors-{name}" class="customization-tab active">
                <h5>Brand Colors</h5>
                <p class="help-text">Customize your brand color palette. The primary color (500) is the main brand color.</p>
                <div class="color-grid">
        """
        
        # Add color pickers for brand colors
        for shade, default_color in default_brand.items():
            label = 'Primary' if shade == '500' else f'Shade {shade}'
            html += f"""
                    <div class="color-item">
                        <label>{label} ({shade})</label>
                        <div class="color-picker-wrapper">
                            <input type="color" 
                                   id="brand-{shade}-{name}" 
                                   value="{default_color}" 
                                   onchange="updateThemeConfig_{name}()"
                                   class="color-picker" />
                            <input type="text" 
                                   id="brand-{shade}-text-{name}" 
                                   value="{default_color}" 
                                   onchange="updateColorFromText_{name}('{shade}')"
                                   class="color-text-input" 
                                   pattern="^#[0-9A-Fa-f]{{6}}$" />
                        </div>
                    </div>
            """
        
        html += """
                </div>
            </div>
            
            <!-- Fonts Tab -->
            <div id="fonts-{name}" class="customization-tab">
                <h5>Typography</h5>
                <p class="help-text">Choose fonts for headings and body text.</p>
                <div class="font-controls">
                    <div class="font-item">
                        <label>Heading Font</label>
                        <select id="heading-font-{name}" onchange="updateThemeConfig_{name}()" class="font-select">
                            {heading_font_options}
                        </select>
                    </div>
                    <div class="font-item">
                        <label>Body Font</label>
                        <select id="body-font-{name}" onchange="updateThemeConfig_{name}()" class="font-select">
                            {body_font_options}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Spacing Tab -->
            <div id="spacing-{name}" class="customization-tab">
                <h5>Spacing</h5>
                <p class="help-text">Adjust spacing values (in rem units). These control padding and margins throughout the theme.</p>
                <div class="spacing-controls">
        """.format(
            name=name,
            heading_font_options=heading_font_options,
            body_font_options=body_font_options
        )
        
        spacing_labels = {
            '4': 'Small (4)',
            '6': 'Medium (6)',
            '8': 'Large (8)',
            '12': 'Extra Large (12)',
            '16': 'Huge (16)',
        }
        
        for key, label in spacing_labels.items():
            value = spacing_values[key]
            html += f"""
                    <div class="spacing-item">
                        <label>{label}</label>
                        <input type="text" 
                               id="spacing-{key}-{name}" 
                               value="{value}" 
                               onchange="updateThemeConfig_{name}()"
                               class="spacing-input" 
                               placeholder="1rem" />
                    </div>
            """
        
        html += f"""
                </div>
            </div>
            
            <!-- Layout Tab -->
            <div id="layout-{name}" class="customization-tab">
                <h5>Layout Customization</h5>
                <p class="help-text">Drag and drop elements to reorder them. Enable/disable elements and configure their positions.</p>
                
                <div class="layout-builder">
                    <div class="layout-regions">
                        <div class="layout-region">
                            <h6>Available Elements</h6>
                            <div id="available-elements-{name}" class="element-list">
        """
        
        # Define layout elements
        layout_elements = [
            {'id': 'top_navigation', 'name': 'Top Navigation', 'icon': '🧭', 'enabled': True},
            {'id': 'top_banner_ad', 'name': 'Top Banner Ad', 'icon': '📢', 'enabled': True},
            {'id': 'featured_article', 'name': 'Featured Article', 'icon': '⭐', 'enabled': True},
            {'id': 'main_articles_grid', 'name': 'Main Articles Grid', 'icon': '📰', 'enabled': True},
            {'id': 'newsletter_subscription', 'name': 'Newsletter Subscription', 'icon': '📧', 'enabled': True},
            {'id': 'pagination', 'name': 'Pagination Controls', 'icon': '📄', 'enabled': True},
            {'id': 'sidebar_ad', 'name': 'Sidebar Ad', 'icon': '📢', 'enabled': True},
            {'id': 'recent_stories', 'name': 'Recent Stories', 'icon': '📚', 'enabled': True},
            {'id': 'bottom_banner_ad', 'name': 'Bottom Banner Ad', 'icon': '📢', 'enabled': True},
        ]
        
        # Get current layout config
        layout_config = config.get('layout', {})
        element_order = layout_config.get('order', [e['id'] for e in layout_elements])
        element_positions = layout_config.get('positions', {})
        element_enabled = layout_config.get('enabled', {e['id']: e['enabled'] for e in layout_elements})
        
        # Build available elements list
        for element in layout_elements:
            is_enabled = element_enabled.get(element['id'], element['enabled'])
            html += f"""
                                <div class="layout-element" 
                                     draggable="true" 
                                     data-element-id="{element['id']}"
                                     data-enabled="{str(is_enabled).lower()}">
                                    <span class="element-icon">{element['icon']}</span>
                                    <span class="element-name">{element['name']}</span>
                                    <label class="element-toggle">
                                        <input type="checkbox" 
                                               id="enable-{element['id']}-{name}" 
                                               {"checked" if is_enabled else ""}
                                               onchange="toggleElement_{name}('{element['id']}')" />
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
            """
        
        html += f"""
                            </div>
                        </div>
                        
                        <div class="layout-region">
                            <h6>Page Layout (Drag to reorder)</h6>
                            <div id="page-layout-{name}" class="element-list sortable">
        """
        
        # Build ordered layout list
        for element_id in element_order:
            element = next((e for e in layout_elements if e['id'] == element_id), None)
            if element:
                is_enabled = element_enabled.get(element['id'], element['enabled'])
                position = element_positions.get(element['id'], 'main')
                html += f"""
                                <div class="layout-element layout-item" 
                                     draggable="true" 
                                     data-element-id="{element['id']}"
                                     data-position="{position}"
                                     data-enabled="{str(is_enabled).lower()}">
                                    <span class="drag-handle">☰</span>
                                    <span class="element-icon">{element['icon']}</span>
                                    <span class="element-name">{element['name']}</span>
                                    <select class="position-select" 
                                            onchange="updateElementPosition_{name}('{element['id']}', this.value)">
                                        <option value="main" {"selected" if position == "main" else ""}>Main Content</option>
                                        <option value="left_sidebar" {"selected" if position == "left_sidebar" else ""}>Left Sidebar</option>
                                        <option value="right_sidebar" {"selected" if position == "right_sidebar" else ""}>Right Sidebar</option>
                                        <option value="header" {"selected" if position == "header" else ""}>Header</option>
                                        <option value="footer" {"selected" if position == "footer" else ""}>Footer</option>
                                    </select>
                                    <span class="element-status" style="color: {'green' if is_enabled else 'gray'}">
                                        {'✓ Enabled' if is_enabled else '✗ Disabled'}
                                    </span>
                                </div>
                """
        
        html += f"""
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Hidden input for JSON config -->
            <input type="hidden" name="{name}" id="theme-config-{name}" value='{json.dumps(config)}' />
            
            <!-- Preview Section -->
            <div class="preview-section">
                <h5>Live Preview</h5>
                <p class="help-text">Preview your theme changes in real-time. The preview updates automatically as you make changes.</p>
                <div class="preview-container">
                    <iframe id="theme-preview-{name}" 
                            src="/admin/theme-preview/?config={config_json_encoded}" 
                            class="preview-iframe"
                            style="width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 4px;"></iframe>
                </div>
                <button type="button" onclick="refreshPreview_{name}()" class="refresh-btn">🔄 Refresh Preview</button>
            </div>
        </div>
        
        <style>
        .theme-customization-widget {{
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 20px;
            margin: 10px 0;
            background: #f9f9f9;
        }}
        
        .customization-header h4 {{
            margin: 0 0 10px 0;
            color: #333;
        }}
        
        .customization-header p {{
            margin: 0 0 15px 0;
            color: #666;
            font-size: 14px;
        }}
        
        .customization-tabs {{
            margin-bottom: 20px;
            border-bottom: 2px solid #ddd;
        }}
        
        .tab-btn {{
            background: transparent;
            border: none;
            padding: 10px 20px;
            margin-right: 5px;
            cursor: pointer;
            font-size: 14px;
            color: #666;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
        }}
        
        .tab-btn:hover {{
            color: #0073e6;
        }}
        
        .tab-btn.active {{
            color: #0073e6;
            border-bottom-color: #0073e6;
            font-weight: bold;
        }}
        
        .customization-tab {{
            display: none;
            padding: 20px 0;
        }}
        
        .customization-tab.active {{
            display: block;
        }}
        
        .customization-tab h5 {{
            margin: 0 0 10px 0;
            color: #333;
        }}
        
        .help-text {{
            margin: 0 0 15px 0;
            color: #666;
            font-size: 13px;
        }}
        
        .color-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }}
        
        .color-item {{
            background: white;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }}
        
        .color-item label {{
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            font-size: 13px;
            color: #333;
        }}
        
        .color-picker-wrapper {{
            display: flex;
            gap: 10px;
            align-items: center;
        }}
        
        .color-picker {{
            width: 60px;
            height: 40px;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
        }}
        
        .color-text-input {{
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }}
        
        .font-controls {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }}
        
        .font-item {{
            background: white;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }}
        
        .font-item label {{
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            font-size: 13px;
            color: #333;
        }}
        
        .font-select {{
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }}
        
        .spacing-controls {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }}
        
        .spacing-item {{
            background: white;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }}
        
        .spacing-item label {{
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            font-size: 13px;
            color: #333;
        }}
        
        .spacing-input {{
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }}
        
        .preview-section {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
        }}
        
        .preview-section h5 {{
            margin: 0 0 10px 0;
            color: #333;
        }}
        
        .preview-container {{
            margin: 15px 0;
        }}
        
        .preview-iframe {{
            background: white;
        }}
        
        .refresh-btn {{
            margin-top: 10px;
            padding: 8px 16px;
            background: #0073e6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }}
        
        .refresh-btn:hover {{
            background: #005cb3;
        }}
        
        /* Layout Builder Styles */
        .layout-builder {{
            margin-top: 20px;
        }}
        
        .layout-regions {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }}
        
        .layout-region {{
            background: white;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }}
        
        .layout-region h6 {{
            margin: 0 0 15px 0;
            font-size: 14px;
            font-weight: bold;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 8px;
        }}
        
        .element-list {{
            min-height: 200px;
            max-height: 500px;
            overflow-y: auto;
        }}
        
        .element-list.sortable {{
            border: 2px dashed #ddd;
            padding: 10px;
            border-radius: 4px;
            background: #f9f9f9;
        }}
        
        .layout-element {{
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            margin-bottom: 8px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: move;
            transition: all 0.2s;
        }}
        
        .layout-element:hover {{
            border-color: #0073e6;
            box-shadow: 0 2px 4px rgba(0,115,230,0.1);
        }}
        
        .layout-element.dragging {{
            opacity: 0.5;
            border-color: #0073e6;
        }}
        
        .layout-element[data-enabled="false"] {{
            opacity: 0.5;
            background: #f5f5f5;
        }}
        
        .drag-handle {{
            cursor: grab;
            font-size: 18px;
            color: #999;
            user-select: none;
        }}
        
        .drag-handle:active {{
            cursor: grabbing;
        }}
        
        .element-icon {{
            font-size: 20px;
        }}
        
        .element-name {{
            flex: 1;
            font-weight: 500;
            font-size: 14px;
            color: #333;
        }}
        
        .element-toggle {{
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
        }}
        
        .element-toggle input {{
            opacity: 0;
            width: 0;
            height: 0;
        }}
        
        .toggle-slider {{
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 24px;
        }}
        
        .toggle-slider:before {{
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }}
        
        .element-toggle input:checked + .toggle-slider {{
            background-color: #0073e6;
        }}
        
        .element-toggle input:checked + .toggle-slider:before {{
            transform: translateX(20px);
        }}
        
        .position-select {{
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
            background: white;
        }}
        
        .element-status {{
            font-size: 12px;
            font-weight: 500;
        }}
        
        .layout-item {{
            background: #f0f7ff;
            border-color: #0073e6;
        }}
        </style>
        
        <script>
        // Tab switching
        function showCustomizationTab_{name}(tabId) {{
            const widget = document.getElementById('theme-customization-{name}');
            if (!widget) return;
            
            // Hide all tabs
            widget.querySelectorAll('.customization-tab').forEach(tab => {{
                tab.classList.remove('active');
            }});
            
            // Remove active from all buttons
            widget.querySelectorAll('.tab-btn').forEach(btn => {{
                btn.classList.remove('active');
            }});
            
            // Show selected tab
            const targetTab = document.getElementById(tabId);
            if (targetTab) {{
                targetTab.classList.add('active');
            }}
            
            // Add active to clicked button
            event.target.classList.add('active');
        }}
        
        // Update theme config JSON
        function updateThemeConfig_{name}() {{
            const config = {{}};
            
            // Collect colors
            const brandColors = {{}};
            for (let shade of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']) {{
                const colorInput = document.getElementById(`brand-${{shade}}-{name}`);
                if (colorInput) {{
                    brandColors[shade] = colorInput.value;
                }}
            }}
            config.colors = {{ brand: brandColors }};
            
            // Collect fonts
            const headingFont = document.getElementById(`heading-font-{name}`);
            const bodyFont = document.getElementById(`body-font-{name}`);
            if (headingFont && bodyFont) {{
                config.fonts = {{
                    heading: headingFont.value + ', sans-serif',
                    body: bodyFont.value + ', sans-serif'
                }};
            }}
            
            // Collect spacing
            const spacing = {{}};
            for (let key of ['4', '6', '8', '12', '16']) {{
                const spacingInput = document.getElementById(`spacing-${{key}}-{name}`);
                if (spacingInput && spacingInput.value) {{
                    spacing[key] = spacingInput.value;
                }}
            }}
            if (Object.keys(spacing).length > 0) {{
                config.space = spacing;
            }}
            
            // Collect layout config (if exists)
            const layoutConfig = document.getElementById(`theme-config-{name}`).value;
            if (layoutConfig) {{
                try {{
                    const parsed = JSON.parse(layoutConfig);
                    if (parsed.layout) {{
                        config.layout = parsed.layout;
                    }}
                }} catch (e) {{
                    console.warn('Could not parse layout config:', e);
                }}
            }}
            
            // Update hidden input
            const hiddenInput = document.getElementById(`theme-config-{name}`);
            if (hiddenInput) {{
                hiddenInput.value = JSON.stringify(config);
            }}
            
            // Update preview
            refreshPreview_{name}();
        }}
        
        // Update color from text input
        function updateColorFromText_{name}(shade) {{
            const textInput = document.getElementById(`brand-${{shade}}-text-{name}`);
            const colorInput = document.getElementById(`brand-${{shade}}-{name}`);
            if (textInput && colorInput && textInput.value.match(/^#[0-9A-Fa-f]{{6}}$/)) {{
                colorInput.value = textInput.value;
                updateThemeConfig_{name}();
            }}
        }}
        
        // Refresh preview
        function refreshPreview_{name}() {{
            const iframe = document.getElementById(`theme-preview-{name}`);
            const hiddenInput = document.getElementById(`theme-config-{name}`);
            if (iframe && hiddenInput) {{
                // Reload iframe with updated config
                const config = hiddenInput.value;
                iframe.src = `/admin/theme-preview/?config=${{encodeURIComponent(config)}}&t=${{Date.now()}}`;
            }}
        }}
        
        // Layout Management Functions
        function toggleElement_{name}(elementId) {{
            const checkbox = document.getElementById(`enable-${{elementId}}-{name}`);
            const enabled = checkbox.checked;
            
            // Update all instances of this element
            document.querySelectorAll(`[data-element-id="${{elementId}}"]`).forEach(el => {{
                el.setAttribute('data-enabled', enabled);
                const statusEl = el.querySelector('.element-status');
                if (statusEl) {{
                    statusEl.textContent = enabled ? '✓ Enabled' : '✗ Disabled';
                    statusEl.style.color = enabled ? 'green' : 'gray';
                }}
            }});
            
            updateLayoutConfig_{name}();
        }}
        
        function updateElementPosition_{name}(elementId, position) {{
            document.querySelectorAll(`[data-element-id="${{elementId}}"]`).forEach(el => {{
                el.setAttribute('data-position', position);
            }});
            updateLayoutConfig_{name}();
        }}
        
        function updateLayoutConfig_{name}() {{
            const pageLayout = document.getElementById(`page-layout-{name}`);
            if (!pageLayout) return;
            
            const order = [];
            const positions = {{}};
            const enabled = {{}};
            
            pageLayout.querySelectorAll('.layout-element').forEach((el, index) => {{
                const elementId = el.getAttribute('data-element-id');
                order.push(elementId);
                positions[elementId] = el.getAttribute('data-position') || 'main';
                enabled[elementId] = el.getAttribute('data-enabled') === 'true';
            }});
            
            // Update theme config with layout
            const config = JSON.parse(document.getElementById(`theme-config-{name}`).value || '{{}}');
            config.layout = {{
                order: order,
                positions: positions,
                enabled: enabled
            }};
            
            document.getElementById(`theme-config-{name}`).value = JSON.stringify(config);
            updateThemeConfig_{name}();
        }}
        
        // Initialize drag and drop
        function initDragAndDrop_{name}() {{
            const pageLayout = document.getElementById(`page-layout-{name}`);
            if (!pageLayout) return;
            
            let draggedElement = null;
            
            pageLayout.querySelectorAll('.layout-element').forEach(element => {{
                element.addEventListener('dragstart', function(e) {{
                    draggedElement = this;
                    this.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', this.innerHTML);
                }});
                
                element.addEventListener('dragend', function(e) {{
                    this.classList.remove('dragging');
                    draggedElement = null;
                }});
                
                element.addEventListener('dragover', function(e) {{
                    if (e.preventDefault) {{
                        e.preventDefault();
                    }}
                    e.dataTransfer.dropEffect = 'move';
                    return false;
                }});
                
                element.addEventListener('dragenter', function(e) {{
                    this.classList.add('drag-over');
                }});
                
                element.addEventListener('dragleave', function(e) {{
                    this.classList.remove('drag-over');
                }});
                
                element.addEventListener('drop', function(e) {{
                    if (e.stopPropagation) {{
                        e.stopPropagation();
                    }}
                    
                    if (draggedElement !== this) {{
                        const allElements = Array.from(pageLayout.querySelectorAll('.layout-element'));
                        const draggedIndex = allElements.indexOf(draggedElement);
                        const targetIndex = allElements.indexOf(this);
                        
                        if (draggedIndex < targetIndex) {{
                            this.parentNode.insertBefore(draggedElement, this.nextSibling);
                        }} else {{
                            this.parentNode.insertBefore(draggedElement, this);
                        }}
                        
                        updateLayoutConfig_{name}();
                    }}
                    
                    this.classList.remove('drag-over');
                    return false;
                }});
            }});
        }}
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {{
            // Sync color pickers with text inputs
            for (let shade of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']) {{
                const colorInput = document.getElementById(`brand-${{shade}}-{name}`);
                const textInput = document.getElementById(`brand-${{shade}}-text-{name}`);
                if (colorInput && textInput) {{
                    colorInput.addEventListener('input', function() {{
                        textInput.value = this.value;
                        updateThemeConfig_{name}();
                    }});
                }}
            }}
            
            // Initialize drag and drop for layout
            initDragAndDrop_{name}();
        }});
        </script>
        """
        
        return mark_safe(html)

