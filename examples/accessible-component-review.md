# Accessible component review: a small newsletter sign-up

This is a compact review of a familiar task: joining a newsletter. The goal is not a grand rewrite. It is to make one useful interaction work comfortably with a keyboard, assistive technology, and a small or unsteady pointer.

## Before

The visible design looks tidy, but the control that submits the form is a generic element, errors arrive without a clear recovery path, and the small “More details” link is easy to miss or tap by accident.

```html
<form id="signup-form">
  <label>Email address</label>
  <input id="email" type="email" placeholder="you@example.com" />
  <div id="signup-action" class="tiny-action">Join the list</div>
  <p id="message"></p>
  <a class="tiny-link" href="/newsletter">More details</a>
</form>

<script>
  const form = document.querySelector('#signup-form');
  const action = document.querySelector('#signup-action');
  const message = document.querySelector('#message');

  action.addEventListener('click', () => form.requestSubmit());

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.email.value.includes('@')) {
      message.textContent = 'That email does not look right.';
      return;
    }
    message.textContent = 'You are on the list.';
  });
</script>
```

## What the review finds

| Area           | What gets in the way                                                                                 | Smallest practical change                                         |
| -------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Semantics      | A clickable `div` does not carry the expected button behavior or name.                               | Use a native submit button.                                       |
| Keyboard       | The action only listens for pointer clicks.                                                          | Let the form and native button handle Enter and Space.            |
| Focus          | After an invalid submission, it is unclear where to continue.                                        | Move focus to the email field and expose the error there.         |
| Error recovery | The error sits apart from the field and gives no next step.                                          | Describe the format, connect the error, and keep the typed value. |
| Target size    | The action and link are too small for many people using touch, tremor-reducing settings, or a mouse. | Give both controls a 44 by 44 CSS-pixel minimum target.           |

## After

The replacement keeps the same short form. Native elements take care of the everyday keyboard behavior; the script only adds validation, a focused recovery point, and a calm success update.

```html
<form id="signup-form" novalidate>
  <label for="email">Email address</label>
  <p id="email-hint">We will send one useful note each month.</p>
  <input
    id="email"
    name="email"
    type="email"
    autocomplete="email"
    aria-describedby="email-hint email-error"
  />
  <p id="email-error" role="alert"></p>

  <button class="submit-button" type="submit">Join the list</button>
  <a class="details-link" href="/newsletter">More details</a>
  <p id="signup-status" aria-live="polite"></p>
</form>

<script>
  const form = document.querySelector('#signup-form');
  const email = document.querySelector('#email');
  const error = document.querySelector('#email-error');
  const status = document.querySelector('#signup-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.textContent = '';
    email.removeAttribute('aria-invalid');

    if (!email.validity.valid) {
      email.setAttribute('aria-invalid', 'true');
      error.textContent = 'Enter an email address such as name@example.com.';
      email.focus();
      return;
    }

    status.textContent = 'You are on the list. Watch your inbox for the next note.';
    form.reset();
  });
</script>
```

```css
.submit-button,
.details-link {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  min-inline-size: 44px;
  min-block-size: 44px;
}

.submit-button:focus-visible,
.details-link:focus-visible,
input:focus-visible {
  outline: 3px solid #005a9c;
  outline-offset: 3px;
}

[aria-invalid='true'] {
  border: 2px solid #b3261e;
}

#email-error {
  color: #b3261e;
  font-weight: 600;
}
```

### Quick verification

1. Tab to **Join the list** and press Enter or Space; tab to **More details** and activate it with Enter.
2. Submit an empty or malformed address. Focus lands on the field, the error names the next action, and the typed address remains available to correct.
3. Submit a valid address. Confirm the screen reader announces the status without moving focus.
4. At 200% zoom and on a touch device, confirm each action remains visibly focused and has a 44 by 44 CSS-pixel target.

The changes live in the component people already use: HTML supplies the semantics, CSS preserves a visible focus cue and usable target size, and JavaScript supports recovery rather than replacing the interaction.
