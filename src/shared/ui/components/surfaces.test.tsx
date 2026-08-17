import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Accordion, AccordionItem } from './accordion';
import { Alert } from './alert';
import { Avatar } from './avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Checkbox } from './checkbox';
import { Container } from './container';
import { Progress } from './progress';
import { Section } from './section';
import { Select } from './select';
import { Separator } from './separator';
import { Skeleton } from './skeleton';
import { Stack } from './stack';
import { Switch } from './switch';
import { Textarea } from './textarea';
import { Tooltip } from './tooltip';

/**
 * The rest of the design system.
 *
 * Same rule as `components.test.tsx`: no snapshots. A snapshot of a `cva` component asserts a
 * class string, which changes on every design pass and still passes when the component loses
 * its accessible name — the one thing that actually breaks for a user.
 *
 * What is asserted here is the part of each component that is *load-bearing for someone using
 * it without sight or without a mouse*: the role, the accessible name, the `aria-*` wiring,
 * and the handful of places where a plausible implementation is silently wrong (a progress bar
 * that renders wider than its track, a separator announced as the wrong orientation, an avatar
 * with no name).
 */

describe('Alert', () => {
  it('interrupts the screen reader only when the news is bad', async () => {
    // `role="alert"` is an assertive live region — it talks over whatever is being read. Right
    // for a failure the user needs now; wrong for four informational alerts on a settings
    // page, which would announce over each other on load.
    const { rerender } = render(<Alert tone="critical">Upload failed</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed');

    rerender(<Alert tone="info">Your plan renews on the 1st</Alert>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('defaults to the informational tone', () => {
    render(<Alert>Heads up</Alert>);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Heads up')).toBeInTheDocument();
  });

  it('renders a title and an actions row alongside the body', () => {
    render(
      <Alert tone="caution" title="Quota nearly spent" actions={<button>Upgrade</button>}>
        Two documents remain this month.
      </Alert>,
    );

    expect(screen.getByText('Quota nearly spent')).toBeInTheDocument();
    expect(screen.getByText('Two documents remain this month.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
  });
});

describe('Avatar', () => {
  it('is one labelled image, not loose initials', () => {
    // The initials underneath are decoration. Read as text they announce "AB" in the middle of
    // a sentence, which is noise; as an image with a label they announce the person.
    render(<Avatar name="Ada Lovelace" />);

    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
  });

  it('derives initials from the name', () => {
    render(<Avatar name="Ada Lovelace" />);

    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveTextContent('AL');
  });

  it('falls back to a placeholder glyph rather than an empty circle', () => {
    render(<Avatar name=" " />);

    expect(screen.getByRole('img')).toHaveTextContent('?');
  });

  it('gives a photo an empty alt, because the wrapper is already labelled', () => {
    // Otherwise the name is announced twice: once for the container, once for the image.
    const { container } = render(<Avatar name="Ada Lovelace" src="https://example.test/a.png" />);

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});

describe('Progress', () => {
  it('exposes value, bounds and an accessible name', () => {
    // A bar announced only as "45%" gives a screen-reader user a number with no subject.
    render(<Progress value={3} max={10} label="Documents analysed this month" />);
    const bar = screen.getByRole('progressbar', { name: 'Documents analysed this month' });

    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
  });

  it('clamps a value the server got wrong instead of overflowing its track', () => {
    // 11 of 10 would otherwise render a fill wider than the bar and push the layout sideways.
    render(<Progress value={11} max={10} label="Quota" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');
  });

  it('clamps a negative value to zero', () => {
    render(<Progress value={-5} max={10} label="Quota" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('survives a max of zero rather than dividing by it', () => {
    render(<Progress value={1} max={0} label="Quota" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('announces a human value in place of a meaningless percentage', () => {
    // "30%" tells a user nothing about a quota. "3 of 10 documents" does.
    render(<Progress value={3} max={10} label="Quota" valueText="3 of 10 documents" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 10 documents');
  });
});

describe('Separator', () => {
  it('renders a plain rule with no label', () => {
    const { container } = render(<Separator />);

    expect(container.querySelector('hr')).toBeInTheDocument();
  });

  it('declares its orientation, because the role default is horizontal', () => {
    // Without `aria-orientation`, a vertical rule is announced as the wrong shape.
    render(<Separator orientation="vertical" />);

    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('renders a centred label between two rules', () => {
    render(<Separator label="or" />);

    expect(screen.getByRole('separator')).toHaveTextContent('or');
  });
});

describe('Skeleton', () => {
  it('renders without announcing itself as content', () => {
    // A skeleton read aloud is a row of nothing. It is a visual placeholder only.
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('accepts a variant', () => {
    const { container } = render(<Skeleton variant="text" />);

    expect(container.firstElementChild).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('composes its parts without imposing a heading level', () => {
    // A card in a page section is not always an `h3`. Forcing one produces a document outline
    // that skips levels, which is a real navigation problem for screen-reader users.
    render(
      <Card>
        <CardHeader>
          <CardTitle as="h2">Rental agreement</CardTitle>
          <CardDescription>Analysed 3 days ago</CardDescription>
        </CardHeader>
        <CardContent>10 risk flags</CardContent>
        <CardFooter>Open</CardFooter>
      </Card>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Rental agreement' })).toBeInTheDocument();
    expect(screen.getByText('Analysed 3 days ago')).toBeInTheDocument();
    expect(screen.getByText('10 risk flags')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('defaults its title to h3', () => {
    render(<CardTitle>Untitled</CardTitle>);

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('passes DOM props through to the card element', () => {
    render(<Card data-testid="card" interactive />);

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});

describe('layout primitives', () => {
  it('Stack renders the element the caller asked for', () => {
    // `ul` when the children are genuinely a list — a stack of `div`s tells a screen reader
    // nothing about how many items there are.
    render(
      <Stack as="ul" direction="row" gap="md">
        <li>one</li>
        <li>two</li>
      </Stack>,
    );

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('Stack defaults to a div', () => {
    const { container } = render(<Stack>content</Stack>);

    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('Section renders a landmark when it is labelled', () => {
    // A bare `<section>` is not a landmark to assistive technology; a labelled one is.
    render(
      <Section aria-label="Pricing">
        <p>plans</p>
      </Section>,
    );

    expect(screen.getByRole('region', { name: 'Pricing' })).toBeInTheDocument();
  });

  it('Section can drop to a div for a purely visual band', () => {
    const { container } = render(<Section as="div">band</Section>);

    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('Container renders its element and children', () => {
    render(
      <Container as="main" width="measure">
        page
      </Container>,
    );

    expect(screen.getByRole('main')).toHaveTextContent('page');
  });
});

describe('form controls', () => {
  it('Checkbox is a real checkbox, so the form and the keyboard both work', async () => {
    // A div with `role="checkbox"` needs Space handling, form participation and indeterminate
    // state reimplemented by hand. The platform element has all three.
    render(
      <label>
        Remember me
        <Checkbox defaultChecked={false} />
      </label>,
    );
    const box = screen.getByRole('checkbox', { name: 'Remember me' });

    await userEvent.click(box);

    expect(box).toBeChecked();
  });

  it('Checkbox forwards disabled', () => {
    render(<Checkbox disabled aria-label="x" />);

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('Switch announces itself as a switch, not a checkbox', () => {
    // The two are read differently — "on/off" versus "checked/unchecked" — and a settings
    // toggle announced as a checkbox reads as a form field the user must submit.
    render(<Switch aria-label="Email notifications" />);

    expect(screen.getByRole('switch', { name: 'Email notifications' })).toBeInTheDocument();
  });

  it('Switch reflects its checked state', async () => {
    render(<Switch aria-label="Email notifications" />);
    const toggle = screen.getByRole('switch');

    await userEvent.click(toggle);

    expect(toggle).toBeChecked();
  });

  it('Select is a native select, keeping the mobile picker', async () => {
    render(
      <Select aria-label="Sort" defaultValue="asc">
        <option value="asc">Oldest first</option>
        <option value="desc">Newest first</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: 'Sort' });

    await userEvent.selectOptions(select, 'desc');

    expect(select).toHaveValue('desc');
  });

  it('Textarea accepts input and forwards its rows', async () => {
    render(<Textarea aria-label="Paste your document" rows={8} />);
    const field = screen.getByRole('textbox', { name: 'Paste your document' });

    await userEvent.type(field, 'clause');

    expect(field).toHaveValue('clause');
    expect(field).toHaveAttribute('rows', '8');
  });
});

describe('Tooltip', () => {
  it('describes its trigger whether or not anyone hovers', async () => {
    // Rendered unconditionally and wired with `aria-describedby`, so a screen-reader user who
    // never produces a hover still gets the text. A tooltip that only exists on `:hover` is
    // invisible to them and to every keyboard user.
    render(
      <Tooltip content="Analysed with heuristic-v1">
        <button>Details</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Details' });
    const tip = screen.getByRole('tooltip');

    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
    expect(tip).toHaveTextContent('Analysed with heuristic-v1');
  });

  it('gives each instance a distinct id', async () => {
    // Two tooltips sharing an id makes `aria-describedby` resolve to whichever came first.
    render(
      <>
        <Tooltip content="a">
          <button>one</button>
        </Tooltip>
        <Tooltip content="b">
          <button>two</button>
        </Tooltip>
      </>,
    );

    const [first, second] = screen.getAllByRole('tooltip');
    expect(first?.id).not.toBe(second?.id);
  });
});

describe('Accordion', () => {
  it('uses details/summary, so it works before hydration and with find-in-page', async () => {
    // A JS-driven accordion hides its closed content from Ctrl+F. `<details>` does not, and it
    // opens with no JavaScript at all — which matters for a legal FAQ that is also a landing page.
    render(
      <Accordion>
        <AccordionItem title="Is my document stored?">No, unless you save it.</AccordionItem>
      </Accordion>,
    );

    const summary = screen.getByText('Is my document stored?');
    expect(screen.getByText('No, unless you save it.')).toBeInTheDocument();

    await userEvent.click(summary);

    expect(summary.closest('details')).toHaveAttribute('open');
  });

  it('opens the item the caller marked as default', () => {
    render(
      <Accordion>
        <AccordionItem title="First" defaultOpen>
          body
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByText('First').closest('details')).toHaveAttribute('open');
  });

  it('makes items in a group mutually exclusive via the name attribute', () => {
    // The browser closes the siblings itself. A typo in `group` silently produces an
    // independent section — which is why it should come from a constant.
    render(
      <Accordion>
        <AccordionItem title="A" group="faq">
          a
        </AccordionItem>
        <AccordionItem title="B" group="faq">
          b
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByText('A').closest('details')).toHaveAttribute('name', 'faq');
    expect(screen.getByText('B').closest('details')).toHaveAttribute('name', 'faq');
  });

  it('forwards a toggle handler', async () => {
    const onToggle = vi.fn();
    render(
      <Accordion>
        <AccordionItem title="A" onToggle={onToggle}>
          a
        </AccordionItem>
      </Accordion>,
    );

    await userEvent.click(screen.getByText('A'));

    expect(onToggle).toHaveBeenCalled();
  });
});
