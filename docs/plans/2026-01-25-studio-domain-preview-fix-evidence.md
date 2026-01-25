# Task 1 Evidence: Studio menu + Vercel inspect

## Studio evidence (chrome-devtools snapshot)

### Missing Skill Categories (shivansh-sharma)
Source URL: https://shivansh-sharma.vercel.app/studio/structure/portfolio;skills
Snapshot captured at: 2026-01-25T15:01:39Z

Snapshot excerpt (Portfolio Content listbox):
```
uid=7_331 option "Skills" selectable value="Skills"
  uid=7_332 link "Skills" url="https://shivansh-sharma.vercel.app/studio/structure/portfolio;skills"
    uid=7_341 StaticText "Skills"
uid=7_348 option "Services" selectable value="Services"
  uid=7_349 link "Services" url="https://shivansh-sharma.vercel.app/studio/structure/portfolio;services"
    uid=7_358 StaticText "Services"
```
Note: No "Skill Categories" item appears in the Portfolio Content listbox.

### Skill Categories present (gamma)
Source URL: https://shivansh-portfolio-gamma.vercel.app/studio/structure/portfolio;skills;skill-categories-menu
Snapshot captured at: 2026-01-25T15:01:39Z

Snapshot excerpt (Skills Management listbox):
```
uid=8_247 listbox "Skills Management" orientation="vertical"
  uid=8_248 option "Skill Categories" selectable value="Skill Categories"
    uid=8_249 link "Skill Categories" url="https://shivansh-portfolio-gamma.vercel.app/studio/structure/portfolio;skills;skill-categories-menu"
      uid=8_258 StaticText "Skill Categories"
```

## Vercel inspect --json evidence

### shivansh-portfolio-gamma.vercel.app
Command:
```
vercel inspect --json shivansh-portfolio-gamma.vercel.app
```
```
"id": "dpl_87hRtsp8zvHwoVgiS1EvMpZgV9cR"
"createdAt": 1769275763941 (2026-01-24T17:29:23.941Z)
```

### shivansh-sharma.vercel.app
Command:
```
vercel inspect --json shivansh-sharma.vercel.app
```
```
"id": "dpl_87hRtsp8zvHwoVgiS1EvMpZgV9cR"
"createdAt": 1769275763941 (2026-01-24T17:29:23.941Z)
```
Note: Post-alias update CLI evidence captured at 2026-01-25T15:11:39Z.

# Task 3 Evidence: Skill Categories visible post-alias update

## shivansh-sharma domain
Source URL: https://shivansh-sharma.vercel.app/studio/structure/portfolio;skills;skill-categories-menu
Snapshot captured at: 2026-01-25T15:10:04Z

Snapshot excerpt (Skills Management listbox):
```
uid=14_33 generic
  uid=14_34 listbox "Skills Management" orientation="vertical"
    uid=14_35 option "Skill Categories" selectable value="Skill Categories"
      uid=14_36 link "Skill Categories" url="https://shivansh-sharma.vercel.app/studio/structure/portfolio;skills;skill-categories-menu"
```

## gamma domain
Source URL: https://shivansh-portfolio-gamma.vercel.app/studio/structure/portfolio;skills;skill-categories-menu
Snapshot captured at: 2026-01-25T15:09:50Z

Snapshot excerpt (Skills Management listbox):
```
uid=13_33 generic
  uid=13_34 listbox "Skills Management" orientation="vertical"
    uid=13_35 option "Skill Categories" selectable value="Skill Categories"
      uid=13_36 link "Skill Categories" url="https://shivansh-portfolio-gamma.vercel.app/studio/structure/portfolio;skills;skill-categories-menu"
```

# Task 4 Evidence: Presentation preview URL updated

## Sanity-hosted Studio presentation
Source URL: https://www.sanity.io/@oIo2DqA1Y/studio/z8phgqxropk95ceoposbxcec/default/presentation
Snapshot captured at: 2026-01-25T15:14:58Z

Snapshot excerpt (preview URL field + Open preview link):
```
textbox value="https://shivansh-sharma.vercel.app/api/draft-mode/enable"
link "Open preview" url="https://shivansh-sharma.vercel.app/api/draft-mode/enable?sanity-preview-perspective=drafts"
```

Reload check: presentation page reloaded; preview URL remains set to deployed domain (not localhost).
Snapshot captured at: 2026-01-25T15:31:12Z

Snapshot excerpt (preview URL textbox):
```
textbox value="https://shivansh-sharma.vercel.app/api/draft-mode/enable"
```

# Task 4 Evidence: Preview loads

Source URL: https://shivansh-sharma.vercel.app/?sanity-preview-perspective=drafts
Snapshot captured at: 2026-01-25T15:24:19Z

Snapshot excerpt (page title):
```
Shivansh Sharma Portfolio
```
Resulting URL: https://shivansh-sharma.vercel.app/?sanity-preview-perspective=drafts

# Task 5 Evidence: Final verification summary

- Skill Categories (shivansh-sharma): https://shivansh-sharma.vercel.app/studio/structure/portfolio;skills;skill-categories-menu at 2026-01-25T15:10:04Z
- Skill Categories (gamma): https://shivansh-portfolio-gamma.vercel.app/studio/structure/portfolio;skills;skill-categories-menu at 2026-01-25T15:09:50Z
- Presentation preview URL set (Sanity Studio): https://www.sanity.io/@oIo2DqA1Y/studio/z8phgqxropk95ceoposbxcec/default/presentation at 2026-01-25T15:14:58Z
- Preview loaded: https://shivansh-sharma.vercel.app/?sanity-preview-perspective=drafts at 2026-01-25T15:24:19Z (title: "Shivansh Sharma Portfolio")
