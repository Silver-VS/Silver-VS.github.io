## Prerequisites

The repository README specifies Python 3.10 or later. PDF extraction helpers have additional requirements; generating the pages is described through the two build scripts. Consult the upstream guide for capture instructions and current configuration.

```sh
git clone https://github.com/Silver-VS/IPN-tools.git
cd IPN-tools
```

## Prepare the offering

Follow the [upstream capture procedure](https://github.com/Silver-VS/IPN-tools/blob/main/docs/AUTOHOSPEDAJE.md) to obtain `horarios_saes.json` and `mapa_curricular_saes.json` from the relevant unit. Place them in `data/`. The self-hosting documentation states that the captured offering takes priority over the bundled UPIITA offering.

Do not include personal academic records when publishing a source copy. The schedule offering and the student's private academic record serve different purposes.

## Generate static pages

For the documented default configuration:

```sh
python tools/build_horarios.py
python tools/build_electivas.py
```

For a different static-hosting location, set `UPIITA_SITE` to that location before running the relevant build. The upstream self-hosting guide describes how the generated loader URLs depend on it.

## Preview and publish

```sh
python -m http.server 8080 --directory web
```

Inspect the generated pages locally. The institutional output is in `web/dist/`; the project's publication script also copies its index and review guide. This Workbench catalog does not run that script or alter the independently deployed application.

## Unit-specific limits

The timetable planner can use another unit's offering. The UPIITA academic-record reader, trajectory rules, and elective workflow are not general IPN services. Recapture the offering when it changes and check the unit detected by the build.

## Validation scope and sources

This guide summarizes the [README](https://github.com/Silver-VS/IPN-tools/blob/main/README.md), [self-hosting procedure](https://github.com/Silver-VS/IPN-tools/blob/main/docs/AUTOHOSPEDAJE.md), and [publication script](https://github.com/Silver-VS/IPN-tools/blob/main/tools/publicar.sh). The IPN-tools build itself was not executed as part of publishing this catalog.
