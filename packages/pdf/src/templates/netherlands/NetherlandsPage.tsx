import type { Style } from "@react-pdf/types";
import type { TemplatePageProps } from "../../document";
import type {
	TemplateColorRoles,
	TemplateFeatureStyleSlots,
	TemplateFeatures,
	TemplateStyleContext,
	TemplateStyleSlots,
} from "../shared/types";
import { Fragment, useMemo } from "react";
import { rgbaStringToHex } from "@reactive-resume/utils/color";
import { Image, Page, StyleSheet, View } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { createBaseTemplateStyles } from "../shared/base-template-styles";
import {
	CustomFieldContactItem,
	EmailContactItem,
	LocationContactItem,
	PhoneContactItem,
	WebsiteContactItem,
} from "../shared/contact-item";
import { TemplateProvider } from "../shared/context";
import { shouldShowResumeHeader } from "../shared/cover-letter";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { getTemplatePageMinHeightStyle, getTemplatePageSize } from "../shared/page-size";
import { hasTemplatePicture } from "../shared/picture";
import { Heading, Text } from "../shared/primitives";
import { createRtlStyleHelpers } from "../shared/rtl";
import { Section } from "../shared/sections";
import { composeStyles, headerNameLineHeight, resolvePlacementColor } from "../shared/styles";

type NetherlandsStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	sidebarColumn: Style;
	mainColumn: Style;
	header: Style;
	picture: Style;
	headerTitle: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	headerContactList: Style;
	headerContactItem: Style;
};

type NetherlandsTemplate = {
	colors: TemplateColorRoles;
	styles: NetherlandsStyles;
	featureStyles: TemplateFeatureStyleSlots;
};

type NetherlandsHeaderProps = {
	styles: NetherlandsStyles;
};

const netherlandsFeatures = {
	sectionTimeline: true,
} satisfies TemplateFeatures;

export const NetherlandsPage = ({ page, pageIndex }: TemplatePageProps) => {
	const data = useRender();
	const { metadata, picture } = data;
	const { colors, styles, featureStyles } = useNetherlandsTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const pageSize = getTemplatePageSize(metadata.page.format);
	const pageMinHeightStyle = getTemplatePageMinHeightStyle(metadata.page.format);
	const hasPicture = hasTemplatePicture(picture);
	const showHeader = shouldShowResumeHeader(data, pageIndex);
	const sidebarSections = filterSections(page.sidebar, data);
	const mainSections = filterSections(page.main, data);

	return (
		<Page size={pageSize} style={composeStyles(styles.page, pageMinHeightStyle)}>
			<TemplateProvider styles={styles} featureStyles={featureStyles} colors={colors} features={netherlandsFeatures}>
				<View
					style={composeStyles(styles.sidebarColumn, {
						display: page.fullWidth ? "none" : "flex",
						flexBasis: `${metadata.layout.sidebarWidth}%`,
						paddingTop: metrics.page.paddingVertical,
						paddingRight: metrics.columnGap,
						paddingBottom: metrics.page.paddingVertical,
						paddingLeft: metrics.page.paddingHorizontal,
						rowGap: metrics.sectionGap,
					})}
				>
					{showHeader && hasPicture && <Image src={picture.url} style={styles.picture} />}

					{sidebarSections.map((section) => (
						<Fragment key={section}>
							<Section section={section} placement="sidebar" />
						</Fragment>
					))}
				</View>

				<View
					style={composeStyles(styles.mainColumn, {
						paddingTop: metrics.page.paddingVertical,
						paddingRight: metrics.page.paddingHorizontal,
						paddingBottom: metrics.page.paddingVertical,
						paddingLeft: page.fullWidth ? metrics.page.paddingHorizontal : metrics.columnGap,
						rowGap: metrics.sectionGap,
					})}
				>
					{showHeader && <Header styles={styles} />}

					{mainSections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</View>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: NetherlandsHeaderProps) => {
	const { basics } = useRender();

	return (
		<View style={styles.header}>
			<View style={styles.headerTitle}>
				<View style={styles.headerIdentity}>
					<Heading style={styles.headerName}>{basics.name}</Heading>
					<Text style={styles.headerHeadline}>{basics.headline}</Text>
				</View>
			</View>

			<View style={styles.headerContactList}>
				<LocationContactItem location={basics.location} style={styles.headerContactItem} />
				<PhoneContactItem phone={basics.phone} style={styles.headerContactItem} />
				<EmailContactItem email={basics.email} style={styles.headerContactItem} />
				<WebsiteContactItem website={basics.website} style={styles.headerContactItem} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem key={field.id} field={field} style={styles.headerContactItem} />
				))}
			</View>
		</View>
	);
};

const useNetherlandsTemplate = (): NetherlandsTemplate => {
	const { picture, metadata, rtl } = useRender();

	return useMemo(() => {
		const r = createRtlStyleHelpers(rtl);
		const foreground = rgbaStringToHex(metadata.design.colors.text);
		const background = rgbaStringToHex(metadata.design.colors.background);
		const primary = rgbaStringToHex(metadata.design.colors.primary);
		
		const colors: TemplateColorRoles = {
			foreground,
			background,
			primary,
			sidebarForeground: background,
			sidebarBackground: primary,
		};
		
		const metrics = getTemplateMetrics(metadata.page);

		const base = createBaseTemplateStyles({ metadata, foreground, r, metrics, picture });

		const baseStyles = StyleSheet.create({
			...base,
			page: {
				flexDirection: r.row,
				color: foreground,
				backgroundColor: background,
				fontFamily: metadata.typography.body.fontFamily,
				fontSize: metadata.typography.body.fontSize,
				lineHeight: metadata.typography.body.lineHeight,
				direction: r.pageDirection,
			},
			sectionHeading: {
				fontSize: metadata.typography.heading.fontSize * 0.85,
				color: primary,
				borderBottomWidth: 1,
				borderBottomColor: primary,
				paddingBottom: metrics.gapY(0.125),
			},
			sidebarColumn: {
				backgroundColor: primary,
			},
			mainColumn: {
				flex: 1,
			},
			picture: {
				width: picture.size,
				height: picture.size,
				borderRadius: picture.borderRadius,
				objectFit: "cover",
				alignSelf: "center",
				marginBottom: metrics.gapY(0.5),
			},
			header: {
				flexDirection: r.row,
				justifyContent: "space-between",
				alignItems: "flex-start",
				borderBottomWidth: 1,
				borderBottomColor: rgbaStringToHex("rgba(224, 224, 224, 0.8)"),
				paddingBottom: metrics.gapY(0.75),
			},
			headerTitle: {
				flexGrow: 1,
				flexShrink: 0,
				rowGap: metrics.gapY(0.125),
			},
			headerIdentity: {
				...r.headerIdentity,
				rowGap: metrics.gapY(0.35),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.5,
				lineHeight: headerNameLineHeight,
			},
			headerHeadline: {
				fontSize: metadata.typography.body.fontSize * 1.1,
				color: primary,
				textTransform: "uppercase",
			},
			headerContactList: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.25),
				alignItems: "flex-end",
				maxWidth: "45%",
				flexShrink: 1,
			},
			headerContactItem: {
				flexDirection: rtl ? "row" : "row-reverse",
				alignItems: "center",
				columnGap: metrics.gapX(0.25),
				fontSize: metadata.typography.body.fontSize * 0.9,
			},
		});

		const sectionTimelineStyles = StyleSheet.create({
			items: {
				position: "relative",
			},
			line: {
				position: "absolute",
				top: 0,
				bottom: 0,
				left: 7.5,
				width: 1,
				backgroundColor: primary,
			},
			item: {
				flexDirection: "row",
				columnGap: metrics.gapX(1 / 2),
				position: "relative",
			},
			marker: {
				width: 16,
				alignItems: "center",
			},
			dot: {
				width: 9,
				height: 9,
				marginTop: 10,
				borderRadius: 999,
				borderWidth: 1,
				borderColor: primary,
				backgroundColor: background,
			},
			content: {
				flex: 1,
			},
		});

		const foregroundFor = ({ placement, colors }: TemplateStyleContext) =>
			resolvePlacementColor({
				placement,
				defaultForeground: colors.foreground,
				sidebarForeground: colors.sidebarForeground,
			});
		const accentFor = ({ placement, colors }: TemplateStyleContext) =>
			resolvePlacementColor({
				placement,
				defaultForeground: colors.primary,
				sidebarForeground: colors.sidebarForeground,
			});

		const featureStyles = {
			sectionTimeline: {
				...sectionTimelineStyles,
				line: (context) => ({
					...sectionTimelineStyles.line,
					backgroundColor: accentFor(context),
				}),
				dot: (context) => ({
					...sectionTimelineStyles.dot,
					borderColor: accentFor(context),
					backgroundColor: context.colors.background,
				}),
			},
		};

		return {
			colors,
			styles: {
				...baseStyles,
				text: (context) => ({ ...baseStyles.text, color: foregroundFor(context) }),
				heading: (context) => ({ ...baseStyles.heading, color: foregroundFor(context) }),
				link: (context) => ({ ...baseStyles.link, color: foregroundFor(context) }),
				richParagraph: (context) => ({ ...baseStyles.richParagraph, color: foregroundFor(context) }),
				richListItemMarker: (context) => ({ ...baseStyles.richListItemMarker, color: foregroundFor(context) }),
				richListItemContent: (context) => ({ ...baseStyles.richListItemContent, color: foregroundFor(context) }),
				splitRow: (context) => ({
					...baseStyles.splitRow,
					...(context.placement === "sidebar"
						? { flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }
						: {}),
				}),
				alignEnd: (context) => ({
					...baseStyles.alignEnd,
					...(context.placement === "sidebar" ? { textAlign: "left" } : {}),
				}),
				sectionHeading: (context) => ({
					...baseStyles.sectionHeading,
					color: accentFor(context),
					borderBottomColor: accentFor(context),
				}),
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: (context) => ({
					display: metadata.page.hideIcons ? "none" : "flex",
					size: metadata.typography.body.fontSize,
					color: accentFor(context),
				}),
			} satisfies NetherlandsStyles,
			featureStyles,
		};
	}, [picture, metadata, rtl]);
};
