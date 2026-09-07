import { useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { Select } from '@base-ui/react/select';
import { Switch } from '@base-ui/react/switch';
import { Checkbox } from '@base-ui/react/checkbox';
import { Dialog } from '@base-ui/react/dialog';
import './ComponentWorkbench.css';

const workspaces = [
  { label: 'Personal workspace', value: 'personal' },
  { label: 'Team workspace', value: 'team' },
  { label: 'Sandbox', value: 'sandbox' },
];

type Preferences = { workspace: string; notifications: boolean; restore: boolean };
const defaults: Preferences = { workspace: 'personal', notifications: true, restore: true };

function workspaceName(value: string) {
  return workspaces.find((item) => item.value === value)?.label ?? value;
}

export default function ComponentWorkbench() {
  const [draft, setDraft] = useState<Preferences>(defaults);
  const [saved, setSaved] = useState<Preferences>(defaults);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState('Ready to explore');
  const [activity, setActivity] = useState<string[]>([]);
  const dirty = draft.workspace !== saved.workspace || draft.notifications !== saved.notifications || draft.restore !== saved.restore;

  function save() {
    setSaved({ ...draft });
    setActivity((items) => [`Saved preferences for ${workspaceName(draft.workspace)}.`, ...items].slice(0, 5));
    setStatus('Preferences saved for this preview');
    setDialogOpen(false);
  }

  return (
    <div className="workbench">
      <div className="wb-header">
        <span className="wb-window-name"><span className="wb-square" aria-hidden="true" /> Workspace</span>
        <span className="wb-browser-label">Interactive browser preview</span>
      </div>
      <Tabs.Root defaultValue="preferences" className="wb-tabs">
        <div className="wb-toolbar">
          <Tabs.List className="wb-tab-list" aria-label="Workspace preview">
            <Tabs.Tab value="preferences" className="wb-tab">Preferences</Tabs.Tab>
            <Tabs.Tab value="activity" className="wb-tab">Activity<span className="wb-count">{activity.length}</span></Tabs.Tab>
          </Tabs.List>
          <span className="wb-toolbar-hint">Try the controls</span>
        </div>
        <Tabs.Panel value="preferences" className="wb-panel">
          <div className="wb-form">
            <div className="wb-section-heading">
              <h3>Make room for your work.</h3>
              <p>A few preferences. Everything in its place.</p>
            </div>
            <div className="wb-field">
              <Select.Root items={workspaces} value={draft.workspace} onValueChange={(value) => value && setDraft((current) => ({ ...current, workspace: value }))}>
                <Select.Label className="wb-label">Default workspace</Select.Label>
                <Select.Trigger className="wb-select-trigger">
                  <Select.Value />
                  <Select.Icon className="wb-chevron" aria-hidden="true">⌄</Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner className="wb-select-positioner" sideOffset={6} alignItemWithTrigger={false}>
                    <Select.Popup className="wb-select-popup">
                      <Select.List className="wb-select-list">
                        {workspaces.map((item) => (
                          <Select.Item className="wb-option" key={item.value} value={item.value}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                            <Select.ItemIndicator className="wb-check" aria-hidden="true">✓</Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.List>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </div>
            <label className="wb-setting-row">
              <span><span className="wb-label">Desktop notifications</span><span className="wb-help">Keep important updates within reach.</span></span>
              <Switch.Root className="wb-switch" checked={draft.notifications} onCheckedChange={(notifications) => setDraft((current) => ({ ...current, notifications }))}>
                <Switch.Thumb className="wb-switch-thumb" />
              </Switch.Root>
            </label>
            <label className="wb-checkbox-row">
              <Checkbox.Root className="wb-checkbox" checked={draft.restore} onCheckedChange={(restore) => setDraft((current) => ({ ...current, restore }))}>
                <Checkbox.Indicator className="wb-checkbox-indicator" aria-hidden="true">✓</Checkbox.Indicator>
              </Checkbox.Root>
              <span>Restore open tabs on launch</span>
            </label>
            <div className="wb-actions">
              <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
                <Dialog.Trigger className="wb-button wb-primary" disabled={!dirty}>Review changes</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop className="wb-dialog-backdrop" />
                  <Dialog.Popup className="wb-dialog">
                    <Dialog.Title className="wb-dialog-title">Save workspace preferences?</Dialog.Title>
                    <Dialog.Description className="wb-dialog-description">These changes apply to this browser preview. Your system settings stay as they are.</Dialog.Description>
                    <dl className="wb-review">
                      <div><dt>Workspace</dt><dd>{workspaceName(draft.workspace)}</dd></div>
                      <div><dt>Notifications</dt><dd>{draft.notifications ? 'On' : 'Off'}</dd></div>
                      <div><dt>Restore tabs</dt><dd>{draft.restore ? 'On' : 'Off'}</dd></div>
                    </dl>
                    <div className="wb-dialog-actions">
                      <Dialog.Close className="wb-button">Cancel</Dialog.Close>
                      <button type="button" className="wb-button wb-primary" onClick={save}>Save preferences</button>
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
              <button type="button" className="wb-button wb-quiet" disabled={!dirty} onClick={() => { setDraft({ ...saved }); setStatus('Changes discarded'); }}>Reset</button>
            </div>
          </div>
          <aside className="wb-summary" aria-label="Saved preferences">
            <span className="wb-eyebrow">Current configuration</span>
            <dl className="wb-summary-list">
              <div><dt>Workspace</dt><dd>{workspaceName(saved.workspace)}</dd></div>
              <div><dt>Notifications</dt><dd>{saved.notifications ? 'Enabled' : 'Disabled'}</dd></div>
              <div><dt>On launch</dt><dd>{saved.restore ? 'Restore tabs' : 'Start fresh'}</dd></div>
            </dl>
            <div className="wb-keyboard-note"><kbd>Tab</kbd> move focus<br /><kbd>Space</kbd> toggle<br /><kbd>Esc</kbd> close popup</div>
          </aside>
        </Tabs.Panel>
        <Tabs.Panel value="activity" className="wb-activity-panel">
          <div className="wb-section-heading"><h3>Your changes, in order.</h3><p>Saved preferences from this preview session.</p></div>
          {activity.length ? <ol className="wb-activity-list">{activity.map((entry, index) => <li key={`${entry}-${index}`}><span className="wb-activity-index">{String(activity.length - index).padStart(2, '0')}</span><span>{entry}</span><span className="wb-activity-state">Saved</span></li>)}</ol> : <div className="wb-empty"><span className="wb-square" aria-hidden="true" /><p>No changes yet.<br /><span>Change a preference, then review and save it.</span></p></div>}
        </Tabs.Panel>
      </Tabs.Root>
      <div className="wb-statusbar"><span role="status" aria-live="polite">{dirty ? 'Unsaved changes' : status}</span><span>Base UI · React</span></div>
    </div>
  );
}
