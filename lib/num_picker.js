const Clutter  = imports.gi.Clutter;
const St       = imports.gi.St;
const Lang     = imports.lang;
const Main        = imports.ui.main;
const Signals  = imports.signals;


/*
 * Number picker
 * A simple widget for picking numbers in a confined way.
 *
 * params:
 *   @num_min, @num_max: number or null
 *
 * signals:
 *   @spinner_changed (Returns counter value and pointer to counter text actor.)
 *
 * @num_min and @num_max are the interval bounds. Use null for no bound.
 * If both @num_min and @num_max are numbers, the picker will wrap around.
 */
function NumPicker(num_min, num_max, num_init) {
    if ( !(typeof(num_min) === 'number' || num_min === null ) ||
         !(typeof(num_max) === 'number' || num_max === null )    ) {
        global.logError('NumPicker needs number or null, got ' + num_min + ' and ' + num_max);
        return;
    }

    this._init(num_min, num_max, num_init);
}

NumPicker.prototype = {
    _init: function(num_min, num_max, num_init) {
        try {
            this.num_min  = num_min;
            this.num_max  = num_max;
            this.num_init = num_init;


            this.counter = num_min ? num_min : 0;


            //
            // actor
            //
            this.actor = new St.BoxLayout({ reactive: true, y_expand: true, x_expand: true, style_class: 'numpicker button notification-icon-button modal-dialog-button' });


            //
            // counter
            //
            this.counter_box = new St.Bin({style_class: 'numpicker-counter'});
            this.actor.add_actor(this.counter_box);
            this.counter_label = new St.Label({ text: this.num_min ? this._left_pad(this.num_min, 2) : '00' });
            this.counter_box.add_actor(this.counter_label);


            //
            // arrows
            //
            this.btn_box = new St.BoxLayout({vertical: true, y_align: Clutter.ActorAlign.CENTER, style_class: 'numpicker-arrow-box'});
            this.actor.add_actor(this.btn_box);

            this.btn_up   = new St.Button({can_focus: true, style_class: 'numpicker-arrow'});
            this.btn_down = new St.Button({can_focus: true, style_class: 'numpicker-arrow'});
            this.btn_box.add_actor(this.btn_up);
            this.btn_box.add_actor(this.btn_down);

            this.arrow_up   = new St.Icon({icon_name: 'pan-up-symbolic'});
            this.arrow_down = new St.Icon({icon_name: 'pan-down-symbolic'});
            this.btn_up.add_actor(this.arrow_up);
            this.btn_down.add_actor(this.arrow_down);


            //
            // listen
            //
            this.btn_up.connect('button-press-event', Lang.bind(this, this._on_press_event, 'up'));
            this.btn_up.connect('key-press-event', Lang.bind(this, this._on_press_event, 'up'));

            this.btn_down.connect('button-press-event', Lang.bind(this, this._on_press_event, 'down'));
            this.btn_down.connect('key-press-event', Lang.bind(this, this._on_press_event, 'down'));

            this.actor.connect('scroll-event', Lang.bind(this, this._on_scroll_event));
        } catch(e) {
            global.logError(e);
        }
    },

    _on_press_event: function (actor, event, step) {
        if (event.type() === Clutter.EventType.BUTTON_PRESS) {
            let button_id = event.get_button();

            if (button_id === Clutter.BUTTON_PRIMARY)
                this._update_counter(step);
        }
        else if (event.type() === Clutter.EventType.KEY_PRESS) {
            let key_id = event.get_key_symbol();

            if (key_id == Clutter.KEY_space || key_id == Clutter.KEY_Return)
                this._update_counter(step);
        }
    },

    _on_scroll_event: function (actor, event) {
        let direction = event.get_scroll_direction();

        if (direction == Clutter.ScrollDirection.DOWN)
            this._update_counter('down');
        else if (direction == Clutter.ScrollDirection.UP)
            this._update_counter('up');
    },

    _update_counter: function (step) {
        if (step === 'up')   this.counter++;
        if (step === 'down') this.counter--;

        if ( (typeof(this.num_max) === 'number') && (this.counter > this.num_max) ) {
            if (typeof(this.num_min) === 'number') {
                this.counter_label.set_text( this._left_pad(this.num_min, 2) );
                this.counter = this.num_min;
            }
            else this.counter = this.num_max;

        }
        else if ( (typeof(this.num_min) === 'number') && (this.counter < this.num_min) ) {
            if (typeof(this.num_max) === 'number') {
                this.counter_label.set_text( this._left_pad(this.num_max, 2) );
                this.counter = this.num_max;
            }
            else this.counter = this.num_min;
        }
        else
            this.counter_label.set_text( this._left_pad(this.counter, 2) );


        this.emit('spinner_changed', this.counter, this.counter_label);
    },

    _left_pad: function (num, size) {
        var s = String( Math.abs(num) );

        while (s.length < (size || 2)) {s = '0' + s;}

        if (num < 0) return '-' + s;
        else         return s;
    },

    _set_counter: function (num) {
        this.counter_label.set_text(this._left_pad(num, 2));
        this.counter = num;
    },
}
Signals.addSignalMethods(NumPicker.prototype);
