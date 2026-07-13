import type { LayoutPage, ResumeData, Typography } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";
import type { Locale } from "@reactive-resume/utils/locale";
import type { ComponentType } from "react";
import type { ResumeRenderOptions } from "./context";
import type { SectionTitleResolver } from "./section-title";
import { useMemo } from "react";
import { Document } from "#react-pdf-renderer";
import { RenderProvider } from "./context";
import { registerFonts, resumeContentContainsCJK, resumeContentScripts } from "./hooks/use-register-fonts";
import { getTemplatePage } from "./templates";

export type TemplatePageProps = {
	page: LayoutPage;
	pageIndex: number;
};

export type TemplatePage = ComponentType<TemplatePageProps>;

type ResumeDocumentProps = {
	data: ResumeData;
	template: Template;
	renderOptions?: ResumeRenderOptions | undefined;
	resolveSectionTitle?: SectionTitleResolver | undefined;
};

const getLayoutPageKey = (page: LayoutPage, pageIndex: number) =>
	`${page.fullWidth ? "full" : "split"}:${page.main.join(",")}:${page.sidebar.join(",")}:${pageIndex}`;

export const ResumeDocument = ({ data, template, renderOptions, resolveSectionTitle }: ResumeDocumentProps) => {
	const TemplatePageComponent = getTemplatePage(template);
	const creationDate = useMemo(() => new Date(), []);
	const hasCjkContent = useMemo(() => resumeContentContainsCJK(data), [data]);
	const scripts = useMemo(() => resumeContentScripts(data), [data]);
	const additionalFontFamilies = useMemo(() => {
		const families = new Set<string>();
		if (!data.metadata.styleRules) return families;
		for (const rule of data.metadata.styleRules) {
			if (!rule.enabled || !rule.slots) continue;
			for (const slot of Object.values(rule.slots)) {
				if (slot && typeof slot === "object" && "fontFamily" in slot && typeof slot.fontFamily === "string") {
					families.add(slot.fontFamily);
				}
			}
		}
		return families;
	}, [data.metadata.styleRules]);

	const typography = registerFonts(
		data.metadata.typography,
		data.metadata.page.locale as Locale,
		hasCjkContent,
		scripts,
		additionalFontFamilies,
	) as Typography;

	// `registerFonts` widens `fontFamily` to `string | string[]` for CJK
	// fallback (#2986); the cast carries that wider runtime value through
	// `ResumeData` without changing the public schema.
	const resumeData = useMemo(() => ({ ...data, metadata: { ...data.metadata, typography } }), [data, typography]);

	return (
		<RenderProvider data={resumeData} resolveSectionTitle={resolveSectionTitle} renderOptions={renderOptions}>
			<Document
				pageMode="useNone"
				creationDate={creationDate}
				producer="Reactive Resume"
				title={resumeData.basics.name}
				author={resumeData.basics.name}
				creator={resumeData.basics.name}
				subject={resumeData.basics.headline}
				language={resumeData.metadata.page.locale}
			>
				{resumeData.metadata.layout.pages.map((page, index) => (
					<TemplatePageComponent key={getLayoutPageKey(page, index)} page={page} pageIndex={index} />
				))}
			</Document>
		</RenderProvider>
	);
};
