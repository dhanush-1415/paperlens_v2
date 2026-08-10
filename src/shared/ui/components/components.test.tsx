import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Slot, Slottable } from '../primitives/slot';

import { Badge } from './badge';
import { Button } from './button';
import { Field } from './field';
import { Input } from './input';
import { Label } from './label';
import { Tabs } from './tabs';

/**
 * The design system, tested through the DOM it produces.
 *
 * These are not snapshot tests. A snapshot of a `cva` component asserts its class string,
 * which changes on every design pass and tells you nothing about whether the component still
 * *works* — and it passes happily when a button loses its accessible name. What is asserted
 * here is the contract a caller actually depends on: the role, the accessible name, the
 * wiring between a label and its control, and the keyboard behaviour.
 */

describe('Button', () => {
 it('defaults to type="button", so it never submits a form by accident', async () => {
 // HTML's default is `submit`. A "Cancel" button inside a form that submits it is the
 // single most common bug this default prevents, and it is invisible until a user hits it.
 const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
 render(
 <form onSubmit={onSubmit}>
 <Button>Cancel</Button>
 </form>,
 );

 expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button');
 await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
 expect(onSubmit).not.toHaveBeenCalled();
 });

 it('still submits when the caller asks for it', async () => {
 const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
 render(
 <form onSubmit={onSubmit}>
 <Button type="submit">Analyze</Button>
 </form>,
 );

 await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));
 expect(onSubmit).toHaveBeenCalledOnce();
 });

 it('marks itself busy while loading rather than disabled to assistive technology', () => {
 // `aria-busy` says "this is happening"; `disabled` says "you cannot do this". Announcing
 // the second during a save is wrong, and unrecoverable if the request then fails.
 render(<Button loading>Save</Button>);
 const button = screen.getByRole('button', { name: /save/i });

 expect(button).toHaveAttribute('aria-busy', 'true');
 });

 it('blocks the click while loading, without the caller having to pass disabled', async () => {
 const onClick = vi.fn();
 render(
 <Button loading onClick={onClick}>
 Save
 </Button>,
 );

 await userEvent.click(screen.getByRole('button', { name: /save/i }));
 expect(onClick).not.toHaveBeenCalled();
 });

 it('hides the start icon while loading — the spinner takes its place', () => {
 const { rerender } = render(<Button startIcon={<span data-testid="icon" />}>Save</Button>);
 expect(screen.getByTestId('icon')).toBeInTheDocument();

 rerender(
 <Button loading startIcon={<span data-testid="icon" />}>
 Save
 </Button>,
 );
 expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
 });

 describe('asChild', () => {
 it('renders one anchor, not an anchor nested in a button', () => {
 render(
 <Button asChild>
 <a href="/pricing">Pricing</a>
 </Button>,
 );

 const link = screen.getByRole('link', { name: 'Pricing' });
 expect(link.tagName).toBe('A');
 expect(link).toHaveAttribute('href', '/pricing');
 // The whole point: no button wrapper, so no second tab stop and no invalid nesting.
 expect(screen.queryByRole('button')).not.toBeInTheDocument();
 });

 it('carries the button classes onto the child', () => {
 render(
 <Button asChild variant="primary">
 <a href="/pricing">Pricing</a>
 </Button>,
 );

 expect(screen.getByRole('link', { name: 'Pricing' }).className).toContain('bg-brand-solid');
 });

 it('never puts type or disabled on a non-button element', () => {
 // `<a type="button">` is meaningless and `<a disabled>` does nothing — both would be
 // invalid attributes shipped to production for every link-shaped button in the product.
 render(
 <Button asChild disabled>
 <a href="/pricing">Pricing</a>
 </Button>,
 );
 const link = screen.getByRole('link');

 expect(link).not.toHaveAttribute('type');
 expect(link).not.toHaveAttribute('disabled');
 });

 it('renders decorations *inside* the child rather than orphaning them (React #143)', () => {
 // The regression this guards: without `Slottable`, `Children.only` sees three children
 // (icon, label, icon) and throws — or, if the icons are dropped to avoid that, they
 // render outside the anchor and stop being part of the link's hit area and name.
 render(
 <Button asChild startIcon={<span data-testid="start" />} endIcon={<span data-testid="end" />}>
 <a href="/pricing">Pricing</a>
 </Button>,
 );

 const link = screen.getByRole('link', { name: 'Pricing' });
 expect(within(link).getByTestId('start')).toBeInTheDocument();
 expect(within(link).getByTestId('end')).toBeInTheDocument();
 });

 it('runs both handlers, child first', async () => {
 const order: string[] = [];
 render(
 <Button asChild onClick={() => order.push('slot')}>
 <a href="#x" onClick={() => order.push('child')}>
 Pricing
 </a>
 </Button>,
 );

 await userEvent.click(screen.getByRole('link'));
 expect(order).toEqual(['child', 'slot']);
 });
 });
});

describe('Slot', () => {
 it('lets the child override a class the slot set', () => {
 render(
 <Slot className="p-2 text-text-primary">
 <span data-testid="child" className="p-8" />
 </Slot>,
 );

 // `cn` resolves the conflict in the child's favour rather than emitting both and letting
 // stylesheet order decide.
 const child = screen.getByTestId('child');
 expect(child.className).toContain('p-8');
 expect(child.className).not.toContain('p-2');
 expect(child.className).toContain('text-text-primary');
 });

 it('merges style per property, child winning', () => {
 render(
 <Slot style={{ color: 'red', margin: '1px' }}>
 <span data-testid="child" style={{ color: 'blue' }} />
 </Slot>,
 );

 expect(screen.getByTestId('child')).toHaveStyle({ color: 'rgb(0, 0, 255)', margin: '1px' });
 });

 it('throws a clear error for two children rather than failing further away', () => {
 // Without `Children.only` this surfaces later as a link with no styles or a missing href,
 // which is a much longer trip back to the cause.
 expect(() =>
 render(
 <Slot>
 <span />
 <span />
 </Slot>,
 ),
 ).toThrow();
 });

 it('renders the marked child when others are present', () => {
 render(
 <Slot data-testid="rendered">
 <span data-testid="decoration" />
 <Slottable>
 <a href="/x">Link</a>
 </Slottable>
 </Slot>,
 );

 const link = screen.getByRole('link');
 expect(link).toHaveAttribute('data-testid', 'rendered');
 expect(within(link).getByTestId('decoration')).toBeInTheDocument();
 });
});

describe('Field — the six things that must all agree', () => {
 it('associates the label with the control the caller renders', () => {
 render(<Field label="Work email">{(field) => <Input {...field} name="email" />}</Field>);

 // `getByLabelText` is the assertion, not `toHaveAttribute('id')`: it passes only if the
 // association actually resolves the way a screen reader resolves it.
 expect(screen.getByLabelText('Work email')).toBeInTheDocument();
 });

 it('describes the control by the description alone when valid', () => {
 render(
 <Field label="Work email" description="We never share it.">
 {(field) => <Input {...field} />}
 </Field>,
 );

 const input = screen.getByLabelText('Work email');
 expect(input).toHaveAccessibleDescription('We never share it.');
 expect(input).not.toHaveAttribute('aria-invalid');
 });

 it('keeps the description when an error appears, in visual order', () => {
 // The bug this catches is the common one: setting `aria-describedby` to the error id and
 // silently dropping the description, so the helper text stops being announced exactly
 // when the user most needs it.
 render(
 <Field label="Work email" description="We never share it." error="Enter a valid address.">
 {(field) => <Input {...field} />}
 </Field>,
 );

 const input = screen.getByLabelText('Work email');
 const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
 expect(ids).toHaveLength(2);

 expect(input).toHaveAccessibleDescription('We never share it. Enter a valid address.');
 expect(input).toHaveAttribute('aria-invalid', 'true');
 });

 it('announces the error, so it is read when it appears rather than on next focus', () => {
 render(
 <Field label="Work email" error="Enter a valid address.">
 {(field) => <Input {...field} />}
 </Field>,
 );

 expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid address.');
 });

 it('matches the required attribute to the visual marker', () => {
 render(<Field label="Work email" required>{(field) => <Input {...field} />}</Field>);

 expect(screen.getByRole('textbox', { name: 'Work email' })).toBeRequired();
 // Asserted through the accessible *name*, not the label's text: the asterisk is
 // `aria-hidden`, so it is in the label element and out of the computed name. A screen
 // reader that read it would announce "Email star, required".
 });

 it('gives every field its own ids, so two on a page never collide', () => {
 render(
 <>
 <Field label="First" error="a">
 {(field) => <Input {...field} />}
 </Field>
 <Field label="Second" error="b">
 {(field) => <Input {...field} />}
 </Field>
 </>,
 );

 const first = screen.getByLabelText('First').getAttribute('aria-describedby');
 const second = screen.getByLabelText('Second').getAttribute('aria-describedby');

 expect(first).not.toBe(second);
 });
});

describe('Input', () => {
 it('hides adornments from the accessible tree', () => {
 // A currency symbol or a search glyph is a visual affordance. Announced, it becomes part
 // of the field's description for no benefit.
 render(<Input aria-label="Amount" startAdornment={<span data-testid="unit">$</span>} />);

 expect(screen.getByTestId('unit').parentElement).toHaveAttribute('aria-hidden');
 });

 it('stays a real input with adornments — the wrapper takes no state of its own', () => {
 render(<Input aria-label="Amount" disabled endAdornment={<span>USD</span>} />);

 expect(screen.getByLabelText('Amount')).toBeDisabled();
 });
});

describe('Label', () => {
 it('hides the required marker from assistive technology', () => {
 render(<Label required>Email</Label>);

 expect(screen.getByText('*')).toHaveAttribute('aria-hidden');
 });
});

describe('Badge', () => {
 it('renders its dot as decoration only', () => {
 render(<Badge dot>Beta</Badge>);

 // Colour alone carries no meaning to a colourblind or greyscale reader, which is exactly
 // why anything communicating risk must use `RiskBadge` instead.
 expect(screen.getByText('Beta')).toBeInTheDocument();
 });
});

describe('Tabs', () => {
 const items = [
 { id: 'summary', label: 'Summary', content: <p>Summary panel</p> },
 { id: 'clauses', label: 'Clauses', content: <p>Clauses panel</p> },
 { id: 'raw', label: 'Raw', content: <p>Raw panel</p>, disabled: true },
 ];

 it('exposes a named tablist with one selected tab', () => {
 render(<Tabs items={items} label="Document sections" />);

 expect(screen.getByRole('tablist', { name: 'Document sections' })).toBeInTheDocument();
 expect(screen.getByRole('tab', { name: 'Summary', selected: true })).toBeInTheDocument();
 expect(screen.getByRole('tab', { name: 'Clauses', selected: false })).toBeInTheDocument();
 });

 it('exposes exactly one panel, keeping the others mounted but hidden', async () => {
 // Mounted, so switching away and back does not empty a half-filled form or lose scroll
 // position. Hidden, so `getByRole` — and every assistive technology — sees only one.
 render(<Tabs items={items} label="Document sections" />);

 expect(screen.getByRole('tabpanel')).toHaveTextContent('Summary panel');
 expect(screen.getByText('Clauses panel')).not.toBeVisible();

 await userEvent.click(screen.getByRole('tab', { name: 'Clauses' }));

 expect(screen.getByRole('tabpanel')).toHaveTextContent('Clauses panel');
 expect(screen.getByText('Summary panel')).not.toBeVisible();
 });

 it('labels each panel by the tab that controls it', () => {
 render(<Tabs items={items} label="Document sections" />);

 const tab = screen.getByRole('tab', { name: 'Summary' });
 const panel = screen.getByRole('tabpanel');

 expect(tab).toHaveAttribute('aria-controls', panel.id);
 expect(panel).toHaveAttribute('aria-labelledby', tab.id);
 });

 it('moves with the arrow keys and wraps, skipping disabled tabs', async () => {
 // The APG requires the list to behave as a loop. A disabled tab that still takes a stop
 // is a keyboard trap for exactly the users who cannot route around it with a mouse.
 render(<Tabs items={items} label="Document sections" />);

 await userEvent.click(screen.getByRole('tab', { name: 'Summary' }));
 await userEvent.keyboard('{ArrowRight}');
 expect(screen.getByRole('tab', { name: 'Clauses' })).toHaveAttribute('aria-selected', 'true');

 // Only two tabs are enabled, so one more step wraps back to the first.
 await userEvent.keyboard('{ArrowRight}');
 expect(screen.getByRole('tab', { name: 'Summary' })).toHaveAttribute('aria-selected', 'true');

 await userEvent.keyboard('{End}');
 expect(screen.getByRole('tab', { name: 'Clauses' })).toHaveAttribute('aria-selected', 'true');
 });

 it('stays put when controlled and the parent does not move it', async () => {
 // The controlled contract: the component renders what it is told, never what it wishes.
 // A component that also updates its own state shows the new tab for one frame and then
 // snaps back, which is the classic controlled-input flicker.
 const onValueChange = vi.fn();
 render(
 <Tabs items={items} label="Document sections" value="summary" onValueChange={onValueChange} />,
 );

 await userEvent.click(screen.getByRole('tab', { name: 'Clauses' }));

 expect(onValueChange).toHaveBeenCalledWith('clauses');
 expect(screen.getByRole('tab', { name: 'Summary' })).toHaveAttribute('aria-selected', 'true');
 });
});
